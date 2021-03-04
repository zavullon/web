const blockMain = document.querySelector('.main_city_weather_block')
const blockExtraWrapper = document.querySelector('.main_weather_list')
const inputAdd = document.querySelector('.city_search_form-input')

const cityFavTemplate = document.querySelector('#fav-city')
const cityMainTemplate = document.querySelector('#main-city')
const dataBlockTemplate = document.querySelector('#weather-data-block')
const loaderTemplate = document.querySelector('#loader')

const defaultCityID = 498817

const getCardinal = angle => {
    const degreePerDirection = 360 / 8;

    const offsetAngle = angle + degreePerDirection / 2;

    return (offsetAngle >= 0 && offsetAngle < degreePerDirection) ? "Север"
        : (offsetAngle >= degreePerDirection && offsetAngle < 2 * degreePerDirection) ? "Северо-Восток"
            : (offsetAngle >= 2 * degreePerDirection && offsetAngle < 3 * degreePerDirection) ? "Восток"
                : (offsetAngle >= 3 * degreePerDirection && offsetAngle < 4 * degreePerDirection) ? "Юго-Восток"
                    : (offsetAngle >= 4 * degreePerDirection && offsetAngle < 5 * degreePerDirection) ? "Юг"
                        : (offsetAngle >= 5 * degreePerDirection && offsetAngle < 6 * degreePerDirection) ? "Юго-Запад"
                            : (offsetAngle >= 6 * degreePerDirection && offsetAngle < 7 * degreePerDirection) ? "Запад"
                                : "Северо-Запад";
}

class Api {
    constructor() {
        this.endpoint = 'http://localhost:3000'
    }

    weatherByString(str) {
        return fetch(`${this.endpoint}/weather/city?q=${encodeURIComponent(str)}`).then(res => res.json())
    }

    weatherById(id) {
        return fetch(`${this.endpoint}/weather/city?id=${encodeURIComponent(id)}`).then(res => res.json())
    }

    weatherByLatLon({latitude, longitude}) {
        return fetch(`${this.endpoint}/weather/coordinates?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`).then(res => res.json())
    }

    saveFavorite(id) {
        return fetch(`${this.endpoint}/favorites`, {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id
            })
        }).then(res => res.json())
    }

    getFavorites() {
        return fetch(`${this.endpoint}/favorites`).then(res => res.json())
    }

    removeFavorite(id) {
        return fetch(`${this.endpoint}/favorites`, {
            method: "DELETE",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id
            })
        }).then(res => res.json())
    }
}

const getCurrentPositionAsync =
    () => new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true
    }))

// Враппер с помощью proxy. Помогает нам при изменении state триггерить нужную функцию отрисовки
const wrap = obj => {
    return new Proxy(obj, {
        get(target, propKey) {
            return target[propKey]
        },
        set(target, prop, value) {
            console.log(value)
            target[prop] = value
            updateHandler(prop)
        }
    })
}

let __state__ = {
    current: {
        loading: false,
        title: "",
        temp: 0,
        params: [
            {title: '', value: ''}
        ]
    },
    starred: []
}

let state = wrap(__state__)

function setState(someNewState) {
    state = someNewState
}
function getState() {
    return state
}

let updateListeners = {}

const updateHandler = prop => {
    if (Array.isArray(updateListeners[prop]))
        updateListeners[prop].forEach(handler => handler())
}


const addListener = (prop, handler) => {
    if (Array.isArray(updateListeners[prop]))
        updateListeners[prop].push(handler)
    else
        updateListeners[prop] = [handler]
}

// просто хэлпер формирующий объект для отображения
const param = (title, value) => {
    return {title, value}
}

const api = new Api()

const weatherMapper = (obj) => {
    const {main, name, wind, coord, id} = obj

    return {
        id,
        title: name,
        temp: Math.round(main.temp),
        params: [
            param('Влажность', main.humidity + '%'),
            param('Давление', main.pressure + ' гПа'),
            param('Ветер м/с', wind.speed + ' м/с'),
            param('Ветер (направление)', getCardinal(wind.angle)),
            param('Координаты', Object.values(coord).join(',')),
        ],
    }
}

function fillTemplate(template, values) {
    return template.replace(/{([^{}]*)}/g, function (a, b) {
        return values[b];
    });
}

const renderStats = stats => {
    if(!stats) return ''
    return stats.map(({title, value}) =>fillTemplate(dataBlockTemplate.innerHTML, {title, value})).join('')
}

const renderBlockMain = () => {
    blockMain.innerHTML = "";

    renderCity(blockMain, cityMainTemplate, state.current)
    return blockMain.innerHTML
}

const renderCity = (parentBlock, cityTemplate, city) => {
    let values, template
    if (city.loading)
    {
        values = {}
        template = loaderTemplate
    }
    else {
        values = {
            title: city.title,
            temp: city.temp,
            id: city.id,
            stats: renderStats(city.params)
        }
        template = cityTemplate
    }
    const node = template.cloneNode(true)
    node.innerHTML = fillTemplate(node.innerHTML, values)
    const nodeImported = document.importNode(node.content, true)
    parentBlock.appendChild(nodeImported)
    return parentBlock
}

const renderBlocksExtra = () => {
    blockExtraWrapper.innerHTML = "";
    state.starred.map((city) => renderCity(blockExtraWrapper, cityFavTemplate, city))
    document.querySelectorAll('.city_remove').forEach(it => {
        it.addEventListener('click', () => {
            const id = it.getAttribute('data-id')
            if(!id) return
            onRemoveClick(id)
        })
    })
    return blockExtraWrapper.innerHTML
}

async function initCurrentPosition() {
    state.current = {
        ...state.current,
        loading: true
    }
    let data = null
    try {
        const pos = await getCurrentPositionAsync()
        const {coords} = pos
        data = await api.weatherByLatLon({
            latitude: coords.latitude,
            longitude: coords.longitude
        })
    } catch (err) {
        data = await api.weatherById(defaultCityID)
    }

    state.current = {
        ...state.current,
        ...weatherMapper(data),
        loading: false
    }
}

async function loadFavorites() {
    const {list} = await api.getFavorites()
    if (list)
    {
        state.starred = [...state.starred, ...list.map(_ => weatherMapper(_))]
    }
    else {
        console.log(list)
    }
}

async function onBtnAddClick(e) {
    e.preventDefault()
    const val = inputAdd.value
    inputAdd.disabled = true
    inputAdd.value = 'Загрузка...'
    try {
        state.starred = [...state.starred, {loading:true}]
        const data = await api.weatherByString(val)
        if (data.cod === '404')
            throw new Error('not found')
        state.starred.pop()
        if(state.starred.map(_=>_.id).includes(data.id)) {
            inputAdd.disabled = false
            inputAdd.value = ''
            state.starred = [...state.starred]
            return alert('Такой город уже есть!')
        }
        await api.saveFavorite(data.id)
        state.starred = [...state.starred, weatherMapper(data)]
    } catch(err) {
        state.starred.pop()
        state.starred = [...state.starred]
        alert('Извините, что-то пошло не так')
    }
    inputAdd.disabled = false
    inputAdd.value = ''
}
async function onRemoveClick(id) {
    state.starred = state.starred.filter(_=>_.id !== parseInt(id, 10))
    await api.removeFavorite(id)
}


function mainFunc() {
    document.querySelector('#form').addEventListener('submit', onBtnAddClick)
    document.querySelectorAll('header>button').forEach((btn) => btn.addEventListener('click', initCurrentPosition))
    addListener('current', renderBlockMain)
    addListener('starred', renderBlocksExtra)
    initCurrentPosition()
    loadFavorites()
}

mainFunc()

module.exports = {
    loadFavorites,
    initCurrentPosition,
    renderBlockMain,
    renderBlocksExtra,
    renderStats,
    weatherMapper,
    Api,
    getCardinal,
    fillTemplate,
    getCurrentPositionAsync,
    wrap,
    addListener,
    updateHandler,
    setState,
    param,
    getState,
    onBtnAddClick,
    onRemoveClick,
}