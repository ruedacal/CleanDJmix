const { Component } = React;

export class FeatureErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error && error.message ? String(error.message) : "Error inesperado en el módulo",
    };
  }

  componentDidCatch(error, info) {
    if (typeof console !== "undefined" && typeof console.error === "function") {
      console.error(`[FeatureErrorBoundary:${this.props.feature || "module"}]`, error, info);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: "" });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 m-3 rounded-xl border border-rose-500/40 bg-rose-950/30 text-rose-100 font-mono text-xs">
          <div className="font-bold uppercase tracking-wider text-rose-300 mb-1">
            Módulo aislado por error: {this.props.feature || "workspace"}
          </div>
          <div className="text-rose-200/80 mb-3 break-all">{this.state.errorMessage}</div>
          <button
            type="button"
            onClick={this.handleRetry}
            className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold cursor-pointer"
          >
            Reintentar módulo
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
