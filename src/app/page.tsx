import { createClient } from "@/lib/supabase/server";
import { Gallery } from "@/components/gallery";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return <main id="main" className="auth-page"><section className="auth-panel"><p className="brand">SKINTIFIC <span>Visual Bank</span></p><h1>Gallery setup is incomplete.</h1><p>The project owner needs to connect the image library before the team can sign in.</p></section></main>;
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <Gallery userId={null} email={null} canManage={false} />;
  const { data: member, error } = await supabase.from("gallery_members").select("active").eq("user_id", user.id).maybeSingle();
  if (error) throw new Error("The gallery could not check your team access. Please try again.");
  return <Gallery userId={user.id} email={user.email ?? "Team member"} canManage={!!member?.active} />;
}
