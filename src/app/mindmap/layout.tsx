import ClientLayout from "@/components/client-layout";

export default function MindmapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClientLayout>{children}</ClientLayout>;
}