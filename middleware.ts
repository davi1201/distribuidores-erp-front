import { NextResponse } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// 1. Rotas Públicas (Nenhuma auth necessária)
const isPublicRoute = createRouteMatcher([
  // '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/invite(.*)',
  '/forgot-password(.*)',
  '/api/webhooks(.*)',
]);

// 2. Rotas de Autenticação (Só para quem NÃO está logado)
const isAuthRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)', '/login', '/register']);

// 3. Rotas do Backoffice
const isBackofficeRoute = createRouteMatcher(['/backoffice(.*)']);

// Roles que têm acesso ao "Muro" do Backoffice
const BACKOFFICE_ROLES = ['SUPER_ADMIN', 'SUPPORT'];

export default clerkMiddleware(async (auth, req) => {
  // Obtém o objeto de autenticação uma única vez
  const authObj = await auth();
  const { userId, sessionClaims } = authObj;

  // Extrai a role do metadata do Clerk
  const role = sessionClaims?.metadata?.role;

  // --- CENÁRIO A: USUÁRIO JÁ LOGADO TENTANDO ACESSAR LOGIN/REGISTER ---
  if (userId && isAuthRoute(req)) {
    if (role && BACKOFFICE_ROLES.includes(role)) {
      return NextResponse.redirect(new URL('/backoffice/dashboard', req.url));
    }
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // --- CENÁRIO B: ROTAS PROTEGIDAS ---
  if (!isPublicRoute(req)) {
    // 1. Força login se não estiver logado
    if (!userId) {
      // Usa redirectToSignIn do objeto authObj existente
      return authObj.redirectToSignIn({ returnBackUrl: req.url });
    }

    // 2. PROTEÇÃO DO BACKOFFICE (Quem NÃO é admin tenta entrar)
    if (isBackofficeRoute(req)) {
      if (!role || !BACKOFFICE_ROLES.includes(role)) {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    // 3. PROTEÇÃO DO DASHBOARD (Quem É admin tenta sair para área comum)
    else {
      if (role && BACKOFFICE_ROLES.includes(role)) {
        return NextResponse.redirect(new URL('/backoffice/dashboard', req.url));
      }
    }
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
