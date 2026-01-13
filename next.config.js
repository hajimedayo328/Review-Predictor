/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // onnxruntime-nodeをサーバーサイドのみで実行
  experimental: {
    serverComponentsExternalPackages: ['@xenova/transformers', 'onnxruntime-node'],
  },

  webpack: (config, { isServer }) => {
    // onnxruntime関連のファイルを無視
    config.resolve.alias = {
      ...config.resolve.alias,
      'onnxruntime-node$': false,
    };

    // .nodeファイルを無視
    config.module.rules.push({
      test: /\.node$/,
      use: 'ignore-loader',
    });

    if (!isServer) {
      // クライアントサイドではonnxruntimeを無効化
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    return config;
  },
};

module.exports = nextConfig;

