import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "../integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { createOffer } from "../lib/offers.functions";

export const Route = createFileRoute("/offers/new")({
  component: CreateOfferPage,
});

function CreateOfferPage() {
  const [session, setSession] = useState<any | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [discount, setDiscount] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session?.user ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session?.user ?? null);
    });

    return () => {
      mounted = false;
      sub?.subscription.unsubscribe();
    };
  }, []);

  async function handleLogin(e: any) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return alert(error.message);
    setSession(data.user ?? null);
  }

  const saveOfferFn = useServerFn(createOffer);

  async function saveOffer() {
    if (!title || !expiresAt) return alert("Please provide a title and expiration");
    try {
      await saveOfferFn({ title, description, discount, expiresAt, badge: null, image: null });
      window.location.href = "/offers";
    } catch (err: any) {
      alert(err?.message || String(err));
    }
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Admin sign in</h2>
        <form onSubmit={handleLogin} className="grid gap-3">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="input" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" className="input" />
          <button disabled={loading} className="btn">Sign in</button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h2 className="text-2xl font-semibold mb-4">Create Offer</h2>
      <div className="grid gap-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="input" />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="input" />
        <input value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="Discount (e.g. 15%)" className="input" />
        <label className="text-sm">Expires at</label>
        <input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="input" />
        <div className="flex gap-3">
          <button onClick={saveOffer} className="btn btn-primary">Save Offer</button>
          <a href="/offers" className="btn">Cancel</a>
        </div>
      </div>
    </div>
  );
}
