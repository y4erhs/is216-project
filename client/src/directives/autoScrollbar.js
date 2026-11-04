export const vAutoScrollbar = {
  mounted(el) {
    let timer
    el.classList.add('auto-scrollbar')           
    el._onScroll = () => {
      el.classList.add('is-scrolling')
      clearTimeout(timer)
      timer = setTimeout(() => el.classList.remove('is-scrolling'), 800)
    }
    el._clear = () => clearTimeout(timer)
    el.addEventListener('scroll', el._onScroll, { passive: true })
  },
  unmounted(el) {
    el.removeEventListener('scroll', el._onScroll)
    el._clear()
  },
}