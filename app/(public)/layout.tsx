import PublicLayout from "./public-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <PublicLayout>
      {children}
    </PublicLayout>
  )
}
