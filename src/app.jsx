/* eslint-disable */

import { Route as rootRouteImport } from './routes/__root'
import { Route as SignupRouteImport } from './routes/signup'
import { Route as OnboardingRouteImport } from './routes/onboarding'
import { Route as LoginRouteImport } from './routes/login'
import { Route as AuthenticatedRouteImport } from './routes/_authenticated'
import { Route as IndexRouteImport } from './routes/index'
import { Route as AuthenticatedSettingsRouteImport } from './routes/_authenticated/settings'
import { Route as AuthenticatedChatRouteImport } from './routes/_authenticated/chat'
import { Route as AuthenticatedChatIndexRouteImport } from './routes/_authenticated/chat.index'
import { Route as AuthenticatedProfileHandleRouteImport } from './routes/_authenticated/profile.$handle'
import { Route as AuthenticatedChatConversationIdRouteImport } from './routes/_authenticated/chat.$conversationId'

const SignupRoute = SignupRouteImport.update({
  id: '/signup',
  path: '/signup',
  getParentRoute: () => rootRouteImport,
})
const OnboardingRoute = OnboardingRouteImport.update({
  id: '/onboarding',
  path: '/onboarding',
  getParentRoute: () => rootRouteImport,
})
const LoginRoute = LoginRouteImport.update({
  id: '/login',
  path: '/login',
  getParentRoute: () => rootRouteImport,
})
const AuthenticatedRoute = AuthenticatedRouteImport.update({
  id: '/_authenticated',
  getParentRoute: () => rootRouteImport,
})
const IndexRoute = IndexRouteImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRouteImport,
})
const AuthenticatedSettingsRoute = AuthenticatedSettingsRouteImport.update({
  id: '/settings',
  path: '/settings',
  getParentRoute: () => AuthenticatedRoute,
})
const AuthenticatedChatRoute = AuthenticatedChatRouteImport.update({
  id: '/chat',
  path: '/chat',
  getParentRoute: () => AuthenticatedRoute,
})
const AuthenticatedChatIndexRoute = AuthenticatedChatIndexRouteImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => AuthenticatedChatRoute,
})
const AuthenticatedProfileHandleRoute =
  AuthenticatedProfileHandleRouteImport.update({
    id: '/profile/$handle',
    path: '/profile/$handle',
    getParentRoute: () => AuthenticatedRoute,
  })
const AuthenticatedChatConversationIdRoute =
  AuthenticatedChatConversationIdRouteImport.update({
    id: '/$conversationId',
    path: '/$conversationId',
    getParentRoute: () => AuthenticatedChatRoute,
  })

const AuthenticatedChatRouteChildren = {
  AuthenticatedChatConversationIdRoute: AuthenticatedChatConversationIdRoute,
  AuthenticatedChatIndexRoute: AuthenticatedChatIndexRoute,
}

const AuthenticatedChatRouteWithChildren =
  AuthenticatedChatRoute._addFileChildren(AuthenticatedChatRouteChildren)

const AuthenticatedRouteChildren = {
  AuthenticatedChatRoute: AuthenticatedChatRouteWithChildren,
  AuthenticatedSettingsRoute: AuthenticatedSettingsRoute,
  AuthenticatedProfileHandleRoute: AuthenticatedProfileHandleRoute,
}

const AuthenticatedRouteWithChildren = AuthenticatedRoute._addFileChildren(
  AuthenticatedRouteChildren,
)

const rootRouteChildren = {
  IndexRoute: IndexRoute,
  AuthenticatedRoute: AuthenticatedRouteWithChildren,
  LoginRoute: LoginRoute,
  OnboardingRoute: OnboardingRoute,
  SignupRoute: SignupRoute,
}

export const routeTree = rootRouteImport
  ._addFileChildren(rootRouteChildren)

