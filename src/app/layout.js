import './globals.css';

export const metadata = {
  title: 'Bolão dos Meladores — Copa do Mundo 2026',
  description: 'Bolão entre amigos para a Copa do Mundo 2026',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
