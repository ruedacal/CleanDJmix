import { FeatureErrorBoundary } from '../../shared/FeatureErrorBoundary.jsx';
import { CopilotWorkspace, CopilotLaunchModal, AppCinematicIntro } from '../../workspaces/CopilotWorkspace.jsx';
import { CopilotCleanMixBanner } from '../../workspaces/CopilotCleanMixBanner.jsx';
import { CopilotCenterMixer } from '../../workspaces/CopilotCenterMixer.jsx';
import { CopilotMixerMirror } from '../../workspaces/CopilotMixerMirror.jsx';
import { CopilotSeratoWaveform } from '../../waveforms/CopilotSeratoWaveform.jsx';

export {
  CopilotWorkspace,
  CopilotLaunchModal,
  AppCinematicIntro,
  CopilotCleanMixBanner,
  CopilotCenterMixer,
  CopilotMixerMirror,
  CopilotSeratoWaveform,
};

export function IsolatedCopilotWorkspace(props) {
  return (
    <FeatureErrorBoundary feature="copilot">
      <CopilotWorkspace {...props} />
    </FeatureErrorBoundary>
  );
}
