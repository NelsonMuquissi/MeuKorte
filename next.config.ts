import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        // O fluxo passou a chamar-se /agendar, para acompanhar a terminologia
        // dos templates. O site ainda não está publicado, mas o redireccionamento
        // fica para não partir links já partilhados em testes.
        source: '/marcar',
        destination: '/agendar',
        permanent: true,
      },
      {
        // A área do cliente passou de /minhas-marcacoes para /conta.
        source: '/minhas-marcacoes',
        destination: '/conta',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
