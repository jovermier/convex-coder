const ReactCompilerConfig = {
  target: '19', // React 19
  
  // Sources to compile  
  sources: (filename) => {
    return filename.includes('/src/');
  },
};

module.exports = ReactCompilerConfig;