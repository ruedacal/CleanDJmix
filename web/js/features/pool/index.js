import { FeatureErrorBoundary } from '../../shared/FeatureErrorBoundary.jsx';
import { SpotifyWorkspace } from '../../workspaces/SpotifyWorkspace.jsx';

export { SpotifyWorkspace };

export function IsolatedPoolWorkspace(props) {
  return (
    <FeatureErrorBoundary feature="pool">
      <SpotifyWorkspace {...props} />
    </FeatureErrorBoundary>
  );
}
