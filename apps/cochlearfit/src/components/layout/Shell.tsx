import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-12 pt-4">{children}</main>
      <Footer />
    </div>
  );
}
