const path = require('path');
const CompressionPlugin = require('compression-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Production optimizations
      if (env === 'production') {
        // Optimize bundle splitting
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          splitChunks: {
            chunks: 'all',
            cacheGroups: {
              // Vendor chunk for node_modules
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                chunks: 'all',
                priority: 10,
              },
              // React chunk
              react: {
                test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
                name: 'react',
                chunks: 'all',
                priority: 20,
              },
              // Stripe chunk
              stripe: {
                test: /[\\/]node_modules[\\/]@stripe[\\/]/,
                name: 'stripe',
                chunks: 'all',
                priority: 15,
              },
              // Common chunks
              common: {
                name: 'common',
                minChunks: 2,
                chunks: 'all',
                priority: 5,
                reuseExistingChunk: true,
              },
              // CSS chunks
              styles: {
                name: 'styles',
                test: /\.css$/,
                chunks: 'all',
                enforce: true,
              },
            },
          },
          minimizer: [
            // Enhanced Terser configuration
            new TerserPlugin({
              terserOptions: {
                compress: {
                  drop_console: true, // Remove console.logs in production
                  drop_debugger: true,
                  pure_funcs: ['console.log', 'console.info', 'console.debug'],
                },
                mangle: {
                  safari10: true,
                },
                format: {
                  comments: false,
                },
              },
              extractComments: false,
            }),
          ],
        };

        // Add compression plugin
        webpackConfig.plugins.push(
          new CompressionPlugin({
            algorithm: 'gzip',
            test: /\.(js|css|html|svg)$/,
            threshold: 8192,
            minRatio: 0.8,
          })
        );

        // Preload important chunks
        webpackConfig.output = {
          ...webpackConfig.output,
          chunkFilename: 'static/js/[name].[contenthash:8].chunk.js',
        };
      }

      // Development optimizations
      if (env === 'development') {
        // Faster builds in development
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          removeAvailableModules: false,
          removeEmptyChunks: false,
          splitChunks: {
            chunks: 'async',
            cacheGroups: {
              default: false,
              vendors: false,
            },
          },
        };
      }

      // Resolve optimizations
      webpackConfig.resolve = {
        ...webpackConfig.resolve,
        alias: {
          ...webpackConfig.resolve.alias,
          '@': path.resolve(__dirname, 'src'),
          '@components': path.resolve(__dirname, 'src/components'),
          '@pages': path.resolve(__dirname, 'src/pages'),
          '@utils': path.resolve(__dirname, 'src/utils'),
          '@styles': path.resolve(__dirname, 'src/styles'),
          '@contexts': path.resolve(__dirname, 'src/contexts'),
        },
      };

      return webpackConfig;
    },
  },
  // Development server optimizations
  devServer: {
    compress: true,
    hot: true,
    client: {
      overlay: {
        warnings: false,
        errors: true,
      },
    },
  },
  // Bundle analyzer (uncomment to analyze bundle)
  // plugins: [
  //   {
  //     plugin: require('webpack-bundle-analyzer').BundleAnalyzerPlugin,
  //     options: {
  //       analyzerMode: 'server',
  //       openAnalyzer: false,
  //     },
  //   },
  // ],
};