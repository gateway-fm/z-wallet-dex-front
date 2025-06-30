import { Path, Svg, Circle } from 'react-native-svg'

// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import { createIcon } from '../factories/createIcon'

export const [UniswapLogo, AnimatedUniswapLogo] = createIcon({
  name: 'UniswapLogo',
  getIcon: (props) => (
    <Svg fill="none" viewBox="0 0 96 96" {...props}>
      <Circle cx="48" cy="48" r="48" fill="currentColor" />
      <Path
        fill="white"
        d="M32 24h32v8H40v8h20v8H40v8h24v8H32V24z"
      />
    </Svg>
  ),
})
