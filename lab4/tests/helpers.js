const trimString = str => str.replace(/\s+/g, "")

const generateState = () => ({
  current: {
    loading: false,
    title: "",
    temp: 0,
    params: [
      {title: '', value: ''}
    ]
  },
  starred: []
})

const generateWeather = () => ({
  main: {
    humidity: 0,
    pressure: 80,
  },
  name: "Moscow",
  temp: 24,
  wind: {
    speed: 1,
    angle: 120,
  },
  coord: {
    latitude: 3,
    longitude: 4
  },
  id: 777
})

function fetchWithResponse(response) {
  return () => new Promise(
    resolve => resolve({json: () => new Promise(resolve2 => resolve2(response))})
  )
}

module.exports = {
  trimString,
  fetchWithResponse,
  generateWeather,
  generateState
}
