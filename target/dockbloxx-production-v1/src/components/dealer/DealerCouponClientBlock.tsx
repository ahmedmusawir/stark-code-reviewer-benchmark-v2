"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { fetchCouponByCode } from "@/services/checkoutServices";
import { Coupon } from "@/types/coupon";
import { useCheckoutStore } from "@/store/useCheckoutStore";
import SpinnerLarge from "../common/SpinnerLarge";
import Image from "next/image";
import { DealerCoupon } from "@/types/dealer-coupon";
import Row from "../common/Row";
import { MdContentCopy } from "react-icons/md";

interface Props {
  data: DealerCoupon;
}

const DealerCouponClientBlock = ({ data }: Props) => {
  const searchParams = useSearchParams();
  const couponCode = searchParams.get("coupon") || "";

  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  const applyCouponToStore = useCheckoutStore(
    (state) => state.applyCouponForDealer
  );

  useEffect(() => {
    const applyCouponFromURL = async () => {
      if (!couponCode) return;
      setStatus("loading");
      const coupon = await fetchCouponByCode(couponCode);
      if (coupon) {
        applyCouponToStore(coupon);
        setAppliedCoupon(coupon);
        setStatus("success");
      } else {
        setStatus("error");
      }
    };

    applyCouponFromURL();
  }, [couponCode, applyCouponToStore]);

  if (status === "idle" && !couponCode) {
    return (
      <div className="mx-auto max-w-7xl px-10 py-24 border-4 text-center my-5">
        <h2 className="text-3xl font-semibold text-orange-500">
          Missing coupon code.
        </h2>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-7xl px-10 py-24 border-4 text-center">
        <h2 className="text-3xl font-semibold text-gray-200 mb-6">
          Validating coupon...
        </h2>
        <SpinnerLarge />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mx-auto max-w-7xl px-10 py-24 border-4 text-center my-5">
        <h2 className="text-3xl font-semibold text-red-500">
          Invalid or expired coupon.
        </h2>
      </div>
    );
  }

  if (status !== "success" || !appliedCoupon) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(appliedCoupon.code);
      alert("Coupon code copied!"); // Optional feedback
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  return (
    <div className="bg-white mx-auto max-w-7xl px-4 py-4 sm:py-5 border-4 my-5 space-y-12">
      {/* Logo Row - Full Width */}
      <div className="relative w-full h-[200px] border-2">
        <Image
          src={data.acf.company_image}
          alt="Custom Services Background"
          fill
          className="object-contain"
          priority
        />
      </div>

      <div>
        <h2 className="text-center">{data.acf.company_text}</h2>
      </div>

      {/* Two-Column Content Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6">
        <section>
          <Link
            href="/shop"
            className="mt-0 block w-full text-center rounded-none bg-blue-600 px-12 p-5 text-xl font-bold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Happy Shopping
          </Link>
        </section>

        <div className="w-full text-center border border-lime-300 p-5 rounded-none bg-lime-300">
          <span className="text-xl font-medium text-gray-900">
            Coupon Applied: {appliedCoupon.code}
          </span>
        </div>
      </div>

      <Row className="flex justify-center items-center">
        <button
          onClick={handleCopy}
          className="flex items-center justify-center gap-2 border-2 border-gray-400 px-6 py-3 text-lg text-gray-800 hover:text-blue-600 hover:border-blue-600 transition-all rounded-none w-full"
        >
          <MdContentCopy className="text-xl" />
          Copy Coupon Code For Future Use
        </button>
      </Row>
    </div>
  );
};

export default DealerCouponClientBlock;
