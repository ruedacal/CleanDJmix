import { FeatureErrorBoundary } from '../../shared/FeatureErrorBoundary.jsx';
import { SetBuilderWorkspace } from '../../workspaces/SetBuilderWorkspace.jsx';

export { SetBuilderWorkspace };

export function IsolatedSetBuilderWorkspace(props) {
  return (
    <FeatureErrorBoundary feature="sets">
      <SetBuilderWorkspace {...props} />
    </FeatureErrorBoundary>
  );
}
