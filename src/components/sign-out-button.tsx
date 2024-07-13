import { signOut } from "@/lib/auth";

export function SignOut() {
  return (
    <form
      action={async () => {
        "use server"
        await signOut()
      }}
    >
      <button type="submit">登出</button>
    </form>
  )
}
