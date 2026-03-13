import { Work_Sans } from "next/font/google";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { hasPmSessionFromCookieHeader } from "../../lib/auth/session";

const display = Work_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export default async function PaymentManagerLoginPage() {
  const cookieHeader = (await headers()).get("cookie");
  const authenticated = await hasPmSessionFromCookieHeader(cookieHeader);
  if (authenticated) {
    redirect("/");
  }

  return (
    <main className={`${display.className} relative min-h-dvh overflow-hidden bg-gate-bg text-gate-ink`}>
      {/* eslint-disable-next-line ds/container-widths-only-at -- PM-0001 operator-tool login page */}
      <div className="relative mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 py-16">
        <div className="w-full overflow-hidden rounded-xl border border-gate-border bg-gate-surface shadow-elevation-2">
          <div className="h-1 bg-gate-accent" />
          <div className="p-8">
            <div className="mb-6 space-y-1 text-center">
              {/* eslint-disable-next-line ds/no-hardcoded-copy -- PM-0001 internal operator tool, not public-facing */}
              <h1 className="text-xl font-semibold text-gate-ink">Payment Manager</h1>
              {/* eslint-disable-next-line ds/no-hardcoded-copy -- PM-0001 internal operator tool, not public-facing */}
              <p className="text-sm text-gate-muted">Operator access only</p>
            </div>
            <PmLoginClient />
          </div>
        </div>
      </div>
    </main>
  );
}

// Inline client component for the login form — keeps the page self-contained at scaffold stage.
// Will be extracted to a separate file once Phase 2 UI tasks land.
function PmLoginClient() {
  return (
    <div
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: `
          <form id="pm-login-form" style="display:flex;flex-direction:column;gap:1rem;">
            <input
              id="pm-token-input"
              type="password"
              placeholder="Admin token"
              autocomplete="current-password"
              style="padding:0.625rem 0.75rem;border-radius:0.5rem;border:1px solid var(--gate-border);background:var(--gate-input-bg);color:var(--gate-ink);font-size:0.875rem;outline:none;"
            />
            <button
              type="submit"
              style="padding:0.625rem 1rem;border-radius:0.5rem;background:var(--gate-accent);color:var(--gate-on-accent);font-size:0.875rem;font-weight:500;border:none;cursor:pointer;"
            >Sign in</button>
            <p id="pm-login-error" style="display:none;color:hsl(0 75% 55%);font-size:0.75rem;text-align:center;"></p>
          </form>
          <script>
            (function(){
              var form=document.getElementById('pm-login-form');
              var input=document.getElementById('pm-token-input');
              var errEl=document.getElementById('pm-login-error');
              if(!form||!input||!errEl) return;
              form.addEventListener('submit',async function(e){
                e.preventDefault();
                errEl.style.display='none';
                var token=input.value.trim();
                if(!token){errEl.textContent='Token required.';errEl.style.display='block';return;}
                try{
                  var r=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:token})});
                  var data=await r.json();
                  if(data.ok){window.location.href='/';}
                  else{errEl.textContent=data.error||'Invalid token.';errEl.style.display='block';}
                }catch(err){errEl.textContent='Network error. Please retry.';errEl.style.display='block';}
              });
            })();
          </script>
        `,
      }}
    />
  );
}
