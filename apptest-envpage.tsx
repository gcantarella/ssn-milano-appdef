Crea un file temporaneo app/test-env/page.tsx:
tsxexport default function TestEnv() {
  return (
    <div>
      <p>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
      <p>KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}</p>
    </div>
  )
}