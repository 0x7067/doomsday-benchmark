import { useEffect, useState } from 'react'
import { setMuted } from '../lib/audio'

type Sound = {
  soundOn: boolean
  toggle: () => void
  enable: () => void
}

/** Single source of truth for audio, mirrored into the audio engine. */
export function useSound(): Sound {
  const [soundOn, setSoundOn] = useState(false)

  const enable = () => {
    setMuted(false)
    setSoundOn(true)
  }

  const toggle = () => {
    setSoundOn((current) => {
      setMuted(current)
      return !current
    })
  }

  useEffect(() => {
    setMuted(!soundOn)
  }, [soundOn])

  return { soundOn, toggle, enable }
}
