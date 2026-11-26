import { FeatureErrorBoundary } from '../../shared/FeatureErrorBoundary.jsx';
import { LibraryWorkspace, CustomLibraryModal, FOLDER_COLORS } from '../../workspaces/LibraryWorkspace.jsx';
import { CollectionTreeSidebar } from '../../shell/CollectionTreeSidebar.jsx';
import { CrateTreeNode } from '../../components/CrateTreeNode.jsx';

export {
  LibraryWorkspace,
  CustomLibraryModal,
  FOLDER_COLORS,
  CollectionTreeSidebar,
  CrateTreeNode,
};

export function IsolatedLibraryWorkspace(props) {
  return (
    <FeatureErrorBoundary feature="library">
      <LibraryWorkspace {...props} />
    </FeatureErrorBoundary>
  );
}
