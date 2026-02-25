import Prepayments from "@/components/prepayments/PrepaymentsContainer";
import Providers from "@/components/Providers";

export default function PrepaymentsContent() {
  return (
    <Providers>
      <Prepayments setMessage={() => {}} />
    </Providers>
  );
}
