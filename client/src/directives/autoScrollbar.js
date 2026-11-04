const HIDE_DELAY = 800

export const vAutoScrollbar = {
  mounted(el) {
    el.classList.add('auto-scrollbar')

    // ---- fade in while scrolling ----
    let timer
    const onScroll = () => {
      el.classList.add('is-scrolling')
      clearTimeout(timer)
      timer = setTimeout(() => el.classList.remove('is-scrolling'), HIDE_DELAY)
    }
    el.addEventListener('scroll', onScroll, { passive: true })

    // ---- measure the scrollbar (true/false → has-scrollbar, number → --sb-width) ----
    const measure = () => {
      const w = el.offsetWidth - el.clientWidth
      el.style.setProperty('--sb-width', `${w}px`)
      el.classList.toggle('has-scrollbar', w > 0)
    }

    // the scrollbar appears when the CONTENT gets taller, so watch the children too
    const ro = new ResizeObserver(measure)
    const watch = () => {
      ro.disconnect()
      ro.observe(el)
      for (const child of el.children) ro.observe(child)
      measure()
    }
    const mo = new MutationObserver(watch) // children added/removed (v-if, v-for)
    mo.observe(el, { childList: true })
    watch()

    el._autoScrollbar = { onScroll, ro, mo, stop: () => clearTimeout(timer) }
  },

  unmounted(el) {
    const s = el._autoScrollbar
    if (!s) return
    el.removeEventListener('scroll', s.onScroll)
    s.ro.disconnect()
    s.mo.disconnect()
    s.stop()
  },
}