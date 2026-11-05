// Attaches the login token to every request to our server, wherever it's made from.
// If the server says the token is no good, they go back to the login page.
import axios from 'axios'
import { API_URL } from './api'
import { getToken, useAuth } from '../composables/useAuth'

const toOurServer = (url) => String(url).startsWith(API_URL)

function sessionExpired() {
    useAuth().logout()
    window.location.assign('/login')
}

export function setUpAuthRequests() {
    axios.interceptors.request.use((config) => {
        if (getToken() && toOurServer(config.url)) config.headers.Authorization = `Bearer ${getToken()}`
        return config
    })
    axios.interceptors.response.use(undefined, (error) => {
        if (error.response?.status === 401 && getToken() && toOurServer(error.config?.url)) sessionExpired()
        return Promise.reject(error)
    })

    const realFetch = window.fetch.bind(window)
    window.fetch = async (url, options = {}) => {
        if (!getToken() || !toOurServer(url)) return realFetch(url, options)
        const headers = new Headers(options.headers)
        headers.set('Authorization', `Bearer ${getToken()}`)
        const response = await realFetch(url, { ...options, headers })
        if (response.status === 401) sessionExpired()
        return response
    }
}
