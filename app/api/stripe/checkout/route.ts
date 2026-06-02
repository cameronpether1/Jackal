import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

const PRICE_MAP = {
  monthly: {
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    mode: "subscription" as const,
  },
  yearly: {
    priceId: process.env.STRIPE_PRO_YEAR_PRICE_ID!,
    mode: "subscription" as const,
  },
  lifetime: {
    priceId: process.env.STRIPE_PRO_LIFETIME_PRICE_ID!,
    mode: "payment" as const,
  },
} as const;

type PlanKey = keyof typeof PRICE_MAP;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const planKey: PlanKey =
      body.plan in PRICE_MAP ? (body.plan as PlanKey) : "monthly";
    const { priceId, mode } = PRICE_MAP[planKey];

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    let customerId = profile?.stripe_customer_id ?? undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email });
      customerId = customer.id;
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/welcome?upgraded=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/welcome`,
      metadata: { userId: user.id },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
