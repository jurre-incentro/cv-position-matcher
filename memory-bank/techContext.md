# Tech Context

## Runtime
- Next.js 15 App Router.
- React 19.
- TypeScript with `strict` enabled.
- Tailwind CSS.
- Node.js runtime for API routes that use server integrations.

## Scripts
- `npm run dev`: local development server.
- `npm run typecheck`: TypeScript verification.
- `npm run build`: production build verification.
- `npm run lint`: configured in `package.json`, but Next.js 15 may require checking whether `next lint` is still supported in the installed version.

## Key Dependencies
- `@supabase/supabase-js` and `@supabase/ssr` for Supabase access.
- `googleapis` for Drive access.
- `pdf-parse` and `mammoth` for CV text extraction.
- `resend` and `svix` for email and webhook verification.
- `zod` for environment validation.
- `lucide-react` for icons.

## Environment Variables
See `.env.local.example`. Required integrations include Supabase, Resend, Google Drive service account, and OpenRouter.

## Verification Expectations
Run at least `npm run typecheck` after code changes. Use `npm run build` when route/runtime behavior changes or before deploy.
