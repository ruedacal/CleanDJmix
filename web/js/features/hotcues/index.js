import { FeatureErrorBoundary } from '../../shared/FeatureErrorBoundary.jsx';
import { HotCuesWorkspace } from '../../workspaces/HotCuesWorkspace.jsx';
import { HotCueStudioModal } from '../../modals/HotCueStudioModal.jsx';
import { CueGrid } from '../../studio/components/CueGrid.jsx';
import { CuePanel } from '../../studio/components/CuePanel.jsx';

export {
  HotCuesWorkspace,
  HotCueStudioModal,
  CueGrid,
  CuePanel,
};

export function IsolatedHotCuesWorkspace(props) {
  return (
    <FeatureErrorBoundary feature="hotcues">
      <HotCuesWorkspace {...props} />
    </FeatureErrorBoundary>
  );
}
