const client = require("../client/src/js/index.js");
const {
  trimString,
  fetchWithResponse,
  generateWeather,
  generateState
} = require('./helpers')

describe("renderStats()", () => {
  it("Должен вернуть пустую строку, если в функцию ничего не передано", () => {
    const stateBlock = client.renderStats()
    expect(stateBlock).toHaveLength(0)
  })
  it("Должен вернуть верный template, если аргументы переданы в функцию", () => {
    const stateBlock = client.renderStats([{
      title: "sometitle",
      value: "somevalue"
    }])
    expect(trimString(stateBlock)).toBe(trimString(`
        <li class="weather_row">
          <div class="weather_row_title">sometitle</div>
          <div class="weather_row_value">somevalue</div>
        </li>
      `))
  })
})

describe("renderBlockMain()", () => {
  it("Должен вернуть верный template, заполенный пустыми данными", () => {
    const state = client.wrap(generateState())
    client.setState(state)
    const blockMain = client.renderBlockMain()
    expect(trimString(blockMain)).toBe(trimString(`
         <div class="main_city_weather_block_common">
            <div class="main_city">
                <h2>
                </h2>
                <div class="main_city_flex">
                    <img src="src/img/weather/rain.png" class="main_city__icon" alt="weather icon">
                    <div class="main_city__temperature">
                        0°C
                    </div>
                </div>
            </div>
         </div>
          <div class="main_city_weather_detail">
              <ul class="weather-block">
                    <li class="weather_row">
                        <div class="weather_row_title">
                        </div>
                        <div class="weather_row_value">
                        </div>
                    </li>
              </ul>
          </div>
      `))
  })
  it("Должен вернуть верный template, если аргументы переданы в функцию с температурой 16", () => {
    const state = client.wrap(generateState())
    state.current.temp = 16
    client.setState(state)
    const blockMain = client.renderBlockMain()
    expect(trimString(blockMain)).toBe(trimString(`
        <div class="main_city_weather_block_common">
            <div class="main_city">
                <h2>
                </h2>
                <div class="main_city_flex">
                    <img src="src/img/weather/rain.png" class="main_city__icon" alt="weather icon">
                    <div class="main_city__temperature">
                        16°C
                    </div>
                </div>
            </div>
         </div>
          <div class="main_city_weather_detail">
              <ul class="weather-block">
                    <li class="weather_row">
                        <div class="weather_row_title">
                        </div>
                        <div class="weather_row_value">
                        </div>
                    </li>
              </ul>
          </div>
      `))
  })
})

describe("renderBlocksExtra()", () => {
  it("should return default HTML if state is not changed", () => {
    const blockExtra = client.renderBlocksExtra()
    expect(blockExtra).toHaveLength(0)
  })
  it("should return default HTML if state is not changed", () => {
    const weather = client.weatherMapper(generateWeather())
    client.setState({
      ...generateState(),
      starred: [weather]
    })
    const blockExtra = client.renderBlocksExtra()
    expect(trimString(blockExtra)).toBe(trimString(`
        
    <li class="mt-2rem">

        <div class="city" style="">
            <h4>
                Moscow
            </h4>
            <div class="city_temperature">
                NaN°C
            </div>
            <img src="src/img/weather/rain.png" class="city_extra__icon" alt="weather icon">
            <button type="button" class="city_remove" data-id="777">
                ✖
            </button>
        </div>
        <ul>
            
     <li class="weather_row">
         <div class="weather_row_title">Влажность</div>
         <div class="weather_row_value">0%</div>
     </li>

     <li class="weather_row">
         <div class="weather_row_title">Давление</div>
         <div class="weather_row_value">80 гПа</div>
     </li>

     <li class="weather_row">
         <div class="weather_row_title">Ветер м/с</div>
         <div class="weather_row_value">1 м/с</div>
     </li>

     <li class="weather_row">
         <div class="weather_row_title">Ветер (направление)</div>
         <div class="weather_row_value">Юго-Восток</div>
     </li>

     <li class="weather_row">
         <div class="weather_row_title">Координаты</div>
         <div class="weather_row_value">3,4</div>
     </li>

        </ul>
    </li>

      `))
  })
})

describe("fillTemplate()", () => {
  it("Должен возвращать заполнять template и возвращать правильный HTML", () => {
    const template = `<h1>{title}</h1><h2>{subtitle}</h2>`
    const filledTemplate = client.fillTemplate(template, {title: "TITLE", subtitle: "SUBTITLE"})
    expect(filledTemplate).toBe(`<h1>TITLE</h1><h2>SUBTITLE</h2>`)
  })
})


const api = new client.Api()
describe("Api()", () => {
  beforeAll(() => {
    global.fetch = (url, options) => new Promise(
      resolve => resolve({json: () => new Promise(resolve2 => resolve2({url, options}))})
    )
  })
  it("Должен иметь эндпоинт http://localhost:3000", () => {
    expect(api).toHaveProperty("endpoint", "http://localhost:3000")
  })
  it("Должен возвращать погоду по строке", async () => {
    const city = "moscow"
    const {url} = await api.weatherByString(city)
    expect(url).toBe(`http://localhost:3000/weather/city?q=${city}`)
  })
  it("Должен возвращать погоду по id", async () => {
    const id = 123456
    const {url} = await api.weatherById(id)
    expect(url).toBe(`http://localhost:3000/weather/city?id=${id}`)
  })
  it("Должен возвращать строку по долготе/широте", async () => {
    const obj = {latitude: 1, longitude: 2}
    const {url} = await api.weatherByLatLon(obj)
    expect(url).toBe(`http://localhost:3000/weather/coordinates?lat=${obj.latitude}&lon=${obj.longitude}`)
  })
  it("Должен сохранять в избранное", async () => {
    const id = 777
    const a = await api.saveFavorite(id)
    const {url, options} = a
    expect(url).toBe(`http://localhost:3000/favorites`)
    expect(options).toHaveProperty('method', 'POST')
    expect(options).toHaveProperty('headers')
    expect(options.headers).toHaveProperty('Accept', 'application/json')
    expect(options.headers).toHaveProperty('Content-Type', 'application/json')
    expect(options).toHaveProperty('body', JSON.stringify({id}))
  })
  it("Должен принимать избранное", async () => {
    const {url} = await api.getFavorites()
    expect(url).toBe(`http://localhost:3000/favorites`)
  })
  it("Должен удалять из избранного", async () => {
    const id = 888
    const {url, options} = await api.removeFavorite(id)
    expect(url).toBe(`http://localhost:3000/favorites`)
    expect(options).toHaveProperty('method', 'DELETE')
    expect(options).toHaveProperty('headers')
    expect(options.headers).toHaveProperty('Accept', 'application/json')
    expect(options.headers).toHaveProperty('Content-Type', 'application/json')
    expect(options).toHaveProperty('body', JSON.stringify({id}))
  })
})

describe('getCoordinates()', () => {
  it('180deg это Юг', () => {
    expect(client.getCardinal(180)).toBe('Юг');
  });

  it('350deg это Северо-запад', () => {
    expect(client.getCardinal(350)).toBe('Северо-Запад');
  });

  it('75deg это Восток', () => {
    expect(client.getCardinal(75)).toBe('Восток');
  });

  it('10deg это Север', () => {
    expect(client.getCardinal(10)).toBe('Север');
  });
});

describe("param()", () => {
  it("Возвращаемое значение должно быть объектом", () => {
    const paramObject = client.param("title", "value")
    expect(paramObject).toBeInstanceOf(Object)
  })
  it("Возвращаемый объект должен соответствовать заданным значениям и полям", () => {
    const paramObject = client.param("HELLO", "WORLD")
    expect(paramObject).toHaveProperty("title", "HELLO")
    expect(paramObject).toHaveProperty("value", "WORLD")
  })
})

describe('getCurrentPositionAsync()', () => {
  it('Возвращается объект с нужными полями', async () => {
    const pos = await client.getCurrentPositionAsync()
    expect(pos.coords).toHaveProperty('latitude', '50');
    expect(pos.coords).toHaveProperty('longitude', '45');
  });
});

describe("addListener()", () => {

  it("addListener для current должен срабатывать, как только меняется current", () => {
    const state = client.wrap(generateState())
    const handler = jest.fn()
    client.addListener("current", handler)
    state.current = "testvalue"
    expect(handler).toBeCalled()
  })

  it("addListener для starred должен срабатывать, как только меняется current", () => {
    const state = client.wrap(generateState())
    const handler = jest.fn()
    client.addListener("starred", handler)
    state.starred = "testvalue2"
    expect(handler).toBeCalled()
  })

  it("addListener для starred не должен срабатывать при изменении current", () => {
    const state = client.wrap(generateState())
    const handler = jest.fn()
    client.addListener("starred", handler)
    state.current = "testvalue2"
    expect(handler).not.toBeCalled()
  })
})

describe("Button Clicks", () => {
  describe("onBtnAddClick()", () => {
    it("Должен делать preventDefault()", () => {
      const prevent = jest.fn()
      client.onBtnAddClick({preventDefault: prevent})
      expect(prevent).toBeCalledTimes(1)
    })
    it("Не должен менять state, если в ответ пришло 404", () => {
      global.fetch = fetchWithResponse({cod: "404"})
      const stateBeforeClick = client.getState()
      client.onBtnAddClick({preventDefault: jest.fn()})
      expect(stateBeforeClick).toBe(client.getState())
    })
  })
  describe("onRemoveClick()", () => {
    it("Должен удалять элемент из starred", () => {
      client.setState({...generateState(), starred: [{id: 1}]})
      expect(client.getState().starred).toHaveLength(1)
      global.fetch = fetchWithResponse({})
      client.onRemoveClick(1)
      expect(client.getState().starred).toHaveLength(0)
    })
  })
})

describe("weatherMapper()", () => {
  it("Должен возвращать объект", () => {
    const weatherObject = client.weatherMapper(generateWeather())
    expect(weatherObject).toBeInstanceOf(Object)
  })
  it("Должен возвращать объект с валидными ключами", () => {
    const weatherObject = client.weatherMapper(generateWeather())
    expect(weatherObject).toHaveProperty("id")
    expect(weatherObject).toHaveProperty("title")
    expect(weatherObject).toHaveProperty("temp")
    expect(weatherObject).toHaveProperty("params")
  })
})

describe("loadFavorites()", () => {
  beforeEach(() => {
    client.setState(generateState())
  })
  it("Должен возвращать state с пустым starred", async () => {
    global.fetch = fetchWithResponse({"cnt": 0, "list": []})
    await client.loadFavorites()
    const state = client.getState()
    expect(state.starred).toHaveLength(0)
  })
  it("Должен возвращать state с 1 элементом в starred", async () => {
    global.fetch = fetchWithResponse({
      "cnt": 1,
      "list": [{
        "coord": {"lon": 37.62, "lat": 55.75},
        "weather": [{"id": 601, "main": "Snow", "description": "snow", "icon": "13n"}],
        "base": "stations",
        "main": {"temp": 1.38, "feels_like": -3.35, "temp_min": 1.11, "temp_max": 2, "pressure": 1019, "humidity": 93},
        "visibility": 10000,
        "wind": {"speed": 4, "deg": 260},
        "snow": {"1h": 0.75},
        "clouds": {"all": 90},
        "dt": 1608222278,
        "sys": {"type": 1, "id": 9029, "country": "RU", "sunrise": 1608184508, "sunset": 1608209786},
        "timezone": 10800,
        "id": 524901,
        "name": "Moscow",
        "cod": 200
      }]
    })
    await client.loadFavorites()
    const state = client.getState()
    expect(state.starred).toHaveLength(1)
  })
})

describe("initCurrentPosition()", () => {
  beforeEach(() => {
    client.setState(generateState())
  })
  it("Должен возвращать правильный state, если передана позиция", async () => {
    global.fetch = fetchWithResponse({
      "coord": {"lon": 45, "lat": 50},
      "weather": [{"id": 804, "main": "Clouds", "description": "overcast clouds", "icon": "04n"}],
      "base": "stations",
      "main": {
        "temp": -4.39,
        "feels_like": -9.67,
        "temp_min": -4.39,
        "temp_max": -4.39,
        "pressure": 1025,
        "humidity": 95,
        "sea_level": 1025,
        "grnd_level": 1011
      },
      "visibility": 10000,
      "wind": {"speed": 3.81, "deg": 268},
      "clouds": {"all": 100},
      "dt": 1608222318,
      "sys": {"country": "RU", "sunrise": 1608180823, "sunset": 1608209928},
      "timezone": 14400,
      "id": 544012,
      "name": "Kostarëvo",
      "cod": 200
    })
    await client.initCurrentPosition()
    const currentState = client.getState()
    expect(currentState.current).toHaveProperty("title", "Kostarëvo")
    expect(currentState.current).toHaveProperty("id", 544012)
  })
  it("Должен возвращать корректный state, если позиция не передана", async () => {
    global.fetch = fetchWithResponse({
      "coord": {"lon": 37.62, "lat": 55.75},
      "weather": [{"id": 601, "main": "Snow", "description": "snow", "icon": "13n"}],
      "base": "stations",
      "main": {"temp": 1.38, "feels_like": -3.35, "temp_min": 1.11, "temp_max": 2, "pressure": 1019, "humidity": 93},
      "visibility": 10000,
      "wind": {"speed": 4, "deg": 260},
      "snow": {"1h": 0.75},
      "clouds": {"all": 90},
      "dt": 1608222278,
      "sys": {"type": 1, "id": 9029, "country": "RU", "sunrise": 1608184508, "sunset": 1608209786},
      "timezone": 10800,
      "id": 524901,
      "name": "Moscow",
      "cod": 200
    })
    global["navigator"] = {
      geolocation: {
        getCurrentPosition: (res, rej, opts) => rej(),
      }
    }
    await client.initCurrentPosition()
    const currentState = client.getState()
    expect(currentState.current).toHaveProperty("title", "Moscow")
    expect(currentState.current).toHaveProperty("id", 524901)
  })
})


