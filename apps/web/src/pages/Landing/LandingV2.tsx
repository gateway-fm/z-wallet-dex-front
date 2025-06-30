import { Hero } from 'pages/Landing/sections/Hero'
import { memo, useRef } from 'react'
import { Flex, styled } from 'ui/src'
import { INTERFACE_NAV_HEIGHT } from 'ui/src/theme'

const Grain = styled(Flex, {
  position: 'absolute',
  inset: 0,
  background: 'url(/images/noise-color.png)',
  opacity: 0.018,
  zIndex: 0,
})

function LandingV2({ transition }: { transition?: boolean }) {
  const scrollAnchor = useRef<HTMLDivElement | null>(null)
  const scrollToRef = () => {
    if (scrollAnchor.current) {
      window.scrollTo({
        top: scrollAnchor.current.offsetTop - 120,
        behavior: 'smooth',
      })
    }
  }

  return (
    <Flex
      position="relative"
      alignItems="center"
      mt={-INTERFACE_NAV_HEIGHT}
      minWidth="100vw"
      data-testid="landing-page"
    >
      <Grain />
      <Hero scrollToRef={scrollToRef} transition={transition} />
    </Flex>
  )
}

export default memo(LandingV2)
