import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';

// 1. Rotas que NÃO exigem autenticação (Área Pública)
const publicRoutes = [
  '/', 
  '/login', 
  '/register',
  '/invite',
  '/forgot-password', 
  '/auth/callback'
];

// 2. Rotas que SÓ usuários NÃO logados podem acessar (Auth Routes)
const authRoutes = ['/login', '/register', '/forgot-password'];

// 3. Configuração do Backoffice
const protectedPrefix = '/backoffice';
// Quem pode entrar no "Muro" do Backoffice?
const backofficeRoles = ['SUPER_ADMIN', 'SUPPORT']; 

// 4. Permissões granulares (Opcional)
const routePermissions: Record<string, string[]> = {
  // '/backoffice/financial': ['SUPER_ADMIN'], 
};

interface UserToken {
  role: string;
  exp: number;
  tenantId: string;
}

export default function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const { pathname } = request.nextUrl;

  // --- CENÁRIO A: USUÁRIO NÃO LOGADO ---
  if (!token) {
    if (publicRoutes.includes(pathname)) {
      return NextResponse.next();
    }

    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // --- CENÁRIO B: USUÁRIO LOGADO ---
  try {
    const decoded = jwtDecode<UserToken>(token);
    const currentTime = Date.now() / 1000;

    // 1. Validação de Token
    if (decoded.exp < currentTime) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('access_token');
      return response;
    }

    // 2. Redirecionamento Inteligente de Login (Se tentar acessar /login logado)
    if (authRoutes.includes(pathname)) {
      if (backofficeRoles.includes(decoded.role)) {
        return NextResponse.redirect(new URL('/backoffice/dashboard', request.url));
      }
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // 3. PROTEÇÃO DO BACKOFFICE (Quem NÃO é admin tenta entrar)
    if (pathname.startsWith(protectedPrefix)) {
      if (!backofficeRoles.includes(decoded.role)) {
        // Chuta usuário comum para o dashboard dele
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      // Verificações granulares dentro do backoffice
      const restrictedRouteKey = Object.keys(routePermissions).find(route => 
        pathname.startsWith(route)
      );
      if (restrictedRouteKey) {
        const allowedRoles = routePermissions[restrictedRouteKey];
        if (!allowedRoles.includes(decoded.role)) {
           return NextResponse.redirect(new URL('/backoffice/dashboard', request.url));
        }
      }
    }
    
    // 4. PROTEÇÃO DO DASHBOARD (Quem É admin tenta sair)
    // Se a rota NÃO é do backoffice E NÃO é pública -> Admin não deve estar aqui
    else if (!publicRoutes.includes(pathname)) {
       if (backofficeRoles.includes(decoded.role)) {
          // Chuta o admin de volta para o backoffice
          return NextResponse.redirect(new URL('/backoffice/dashboard', request.url));
       }
    }

  } catch (error) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('access_token');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public|.*\\.png$).*)'],
};