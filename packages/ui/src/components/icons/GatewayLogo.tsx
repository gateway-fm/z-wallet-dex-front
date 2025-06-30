import { Path, Svg } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [GatewayLogo, AnimatedGatewayLogo] = createIcon({
  name: 'GatewayLogo',
  getIcon: (props) => (
    <Svg viewBox="0 0 37 40" fill="none" {...props}>
      <Path
        d="M32.6762 4.81912L0 21.5476V26.9183L32.7237 10.1656L32.6762 4.81912Z"
        fill="currentColor"
      />
      <Path
        d="M23.5331 0L23.5806 5.48486L0 17.5569V12.0477L23.5331 0Z"
        fill="currentColor"
      />
      <Path
        d="M18.595 21.3894L23.8405 18.704L36.4 25.1338V30.5046L18.595 21.3894Z"
        fill="currentColor"
      />
      <Path
        d="M36.4 12.2743V21.1431L27.7381 16.7087L36.4 12.2743Z"
        fill="currentColor"
      />
      <Path
        d="M14.6974 23.3848L32.6763 32.5889L18.2 40L0.221173 30.7958L5.55429 28.0656L18.2854 34.5833L22.1831 32.5879L9.45192 26.0702L14.6974 23.3848Z"
        fill="currentColor"
      />
    </Svg>
  ),
  defaultFill: '#8950FA',
}) 