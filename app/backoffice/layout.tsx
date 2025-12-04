import BackofficeLayout from "./backoffice-layout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <BackofficeLayout>{children}</BackofficeLayout>
  )
}