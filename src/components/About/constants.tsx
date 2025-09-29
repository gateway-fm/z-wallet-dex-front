import { Terminal } from 'react-feather'
import styled from 'styled-components'
import { lightTheme } from 'theme/colors'

import darkArrowImgSrc from './images/aboutArrowDark.png'
import lightArrowImgSrc from './images/aboutArrowLight.png'
import darkTerminalImgSrc from './images/aboutTerminalDark.png'
import hors from './images/hors.png'
import swapCardImgSrc from './images/swapCard.png'

export const MAIN_CARDS = [
  {
    to: '/swap',
    title: 'Swap tokens',
    description: 'Buy, sell, and explore tokens on Ethereum, Polygon, Optimism, and more.',
    cta: 'Trade Tokens',
    darkBackgroundImgSrc: swapCardImgSrc,
    lightBackgroundImgSrc: swapCardImgSrc,
  },
]

const StyledCardLogo = styled.img`
  min-width: 20px;
  min-height: 20px;
  max-height: 48px;
  max-width: 48px;
`

export const MORE_CARDS = [
  {
    to: '/whatishorswap',
    title: 'Horswap?',
    description: 'Read more about this censorship resistant and privacy protecting',
    lightIcon: <StyledCardLogo src={hors} alt="What is Horswap?" />,
    darkIcon: <StyledCardLogo src={hors} alt="What is Horswap?" />,
    cta: 'Read more',
  },
  {
    to: '/pools',
    title: 'Earn',
    description: 'Provide liquidity to pools and earn fees on swaps.',
    lightIcon: <StyledCardLogo src={lightArrowImgSrc} alt="Analytics" />,
    darkIcon: <StyledCardLogo src={darkArrowImgSrc} alt="Analytics" />,
    cta: 'Provide liquidity',
  },
  {
    to: 'https://docs.uniswap.org',
    external: true,
    title: 'Build dApps',
    description: 'Build apps and tools on the largest DeFi protocol on Ethereum.',
    lightIcon: <Terminal color={lightTheme.neutral3} size={48} />,
    darkIcon: <StyledCardLogo src={darkTerminalImgSrc} alt="Developers" />,
    cta: 'Developer docs',
  },
]
