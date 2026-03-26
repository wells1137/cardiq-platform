function readPackage(pkg, context) {
  // Fix peer dependency conflict for @builder.io/vite-plugin-jsx-loc
  return pkg;
}

module.exports = {
  hooks: {
    readPackage,
  },
};
