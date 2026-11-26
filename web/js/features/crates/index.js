import { FeatureErrorBoundary } from '../../shared/FeatureErrorBoundary.jsx';
import { TaxonomyWorkspace } from '../../workspaces/TaxonomyWorkspace.jsx';

export { TaxonomyWorkspace };

export function IsolatedCratesWorkspace(props) {
  return (
    <FeatureErrorBoundary feature="crates">
      <TaxonomyWorkspace {...props} />
    </FeatureErrorBoundary>
  );
}
