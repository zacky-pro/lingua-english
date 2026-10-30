<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Hosting: the app runs on Lovable hosting (Cloudflare worker target); do NOT add vercel.json, _redirects, netlify.toml or SPA-fallback files, and do not claim Vercel deployments can serve SSR/server functions — GitHub sync never deploys to Vercel.
- Google sign-in uses the managed broker (lovable.auth.signInWithOAuth) on Lovable-hosted origins only; on other origins auth.tsx falls back to direct supabase.auth.signInWithOAuth("google"), which needs owner-supplied Google OAuth credentials.
