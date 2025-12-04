import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';

// 1. Defina quais rotas são públicas (não precisam de token)
const publicRoutes = ['/login', '/register', '/forgot-password', '/', '/auth/callback'];

// 2. Defina as permissões de rotas protegidas
const routePermissions = {
  '/backoffice': ['SUPER_ADMIN', 'SUPPORT'],
  '/subscription': ['OWNER'],
  '/team': ['OWNER', 'ADMIN'],
  // Adicione outras rotas conforme necessário
};

interface UserToken {
  role: string;
  exp: number;  
}

export default function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const { pathname } = request.nextUrl;

  // ----------------------------------------------------------------
  // CENÁRIO A: Usuário NÃO logado
  // ----------------------------------------------------------------
  if (!token) {
    // Se a rota for pública, deixa passar
    if (publicRoutes.includes(pathname)) {
      return NextResponse.next();
    }
    
    // Se tentar acessar rota protegida, manda pro login
    // Dica: salvamos a url de origem para redirecionar de volta depois
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ----------------------------------------------------------------
  // CENÁRIO B: Usuário LOGADO
  // ----------------------------------------------------------------
  if (token) {
    try {
      const decoded = jwtDecode<UserToken>(token);
      const userRole = decoded.role;
      const currentTime = Date.now() / 1000;

      // Verificação extra: Token expirado?
      if (decoded.exp < currentTime) {
        // Remove o cookie e manda pro login
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('access_token');
        return response;
      }

      // 1. Se usuário logado tentar acessar páginas públicas (login/register),
      // redireciona para a home dele.
      if (publicRoutes.includes(pathname)) {
        if (userRole === 'SUPER_ADMIN') {
          return NextResponse.redirect(new URL('/', request.url));
        }
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      // 2. Verificação de Permissão por Role (RBAC)
      // Encontra se a rota atual começa com alguma chave definida em routePermissions
      const restrictedRouteKey = Object.keys(routePermissions).find(route => 
        pathname.startsWith(route)
      );

      if (restrictedRouteKey) {
        const allowedRoles = routePermissions[restrictedRouteKey as keyof typeof routePermissions];
        
        // Se a role do usuário não estiver na lista permitida
        if (!allowedRoles.includes(userRole)) {
          console.warn(`Acesso negado: User ${userRole} tentou acessar ${pathname}`);
          
          // Redireciona para um lugar seguro baseado no perfil
          if (userRole === 'SUPER_ADMIN') {
             return NextResponse.redirect(new URL('/backoffice/dashboard', request.url));
          }
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      }

    } catch (e) {
      // Se o token estiver corrompido ou inválido, força logout
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('access_token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
};