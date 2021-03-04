const server = require("../server/index.js");
const request = require("supertest");
const weatherApi  = new server.WeatherApi()

afterEach(() => server.server.close())

beforeEach(() => server.Favorite.remove({}))

describe("Api()", () => {
  it("Должен иметь эндпоинт https://api.openweathermap.org/data/2.5", () => {
    expect(weatherApi).toHaveProperty("endpoint", "https://api.openweathermap.org/data/2.5")
  })
  it("Должен возвращать погоду по строке", async () => {
    const city = "moscow"
    const {data} = await weatherApi.weatherByString(city)
    expect(data.name).toBe("Moscow")
    expect(data.cod).toBe(200)
    expect(data.id).toBe(524901)
  })
  it("Должен возвращать погоду по id", async () => {
    const id = 524901
    const {data} = await weatherApi.weatherById(id)
    expect(data.name).toBe("Moscow")
    expect(data.cod).toBe(200)
    expect(data.id).toBe(id)
  })
  it("Должен возвращать массив данных о погоде по нескольким id", async () => {
    const ids = [524901,2643743]
    const {data} = await weatherApi.weatherByIds(ids)
    expect(data).toHaveProperty("cnt",2)
    expect(data.list).toHaveLength(2)
    expect(data.list.some(_=>_.name === "London")).toBeTruthy()
    expect(data.list.some(_=>_.name === "Moscow")).toBeTruthy()
  })
  it("Должен возвращать погоду по широте/долготе", async () => {
    const latlon = {latitude: 55.75, longitude:37.61}
    const {data} = await weatherApi.weatherByLatLon(latlon)
    expect(data.name).toBe("Moscow")
    expect(data.cod).toBe(200)
    expect(data.id).toBe(524901)
  })
})

describe("express.app()", () => {
  describe("/weather", () => {
    it("Должен возвращать данные о погоде города Самара для id = 499099", () => {
      return request(server.app)
        .get('/weather/city?id=499099')
        .then(response => {
          expect(response.statusCode).toBe(200)
          expect(response.body.name).toBe("Samara")
        })
    })
    it("Должен возвращать данные о погоде города Самара по строке Samara", () => {
      return request(server.app)
        .get(`/weather/city?q=Samara`)
        .then(response => {
          expect(response.statusCode).toBe(200)
          expect(response.body.name).toBe("Samara Oblast")
          expect(response.body.id).toBe(499068)
        })
    })
    it("Должен возвращать данные о погоде города Самара про широте и долготе", () => {
      return request(server.app)
        .get(`/weather/coordinates?lat=${encodeURIComponent(53.2)}&lon=${encodeURIComponent(50.15)}`)
        .then(response => {
          expect(response.statusCode).toBe(200)
          expect(response.body.name).toBe("Samara")
          expect(response.body.id).toBe(499099)
        })
    })
  })
  describe("/favorites", () => {
    it("Должен возвращать данные о погоде избранных городов", async () => {
      const WASHINGTON_ID = 5815135
      const req = request(server.app)
      const responseInitialList = await req.get("/favorites")
      expect(responseInitialList.status).toBe(200)

      const initialLength = (responseInitialList.body.list || []).length
      const responsePost = await req.post("/favorites").send({id:WASHINGTON_ID})
      expect(responsePost.status).toBe(200)
      expect(responsePost.body).toHaveProperty("msg", "success")

      const responseCompleteList = await req.get("/favorites")
      const completeLength = (responseCompleteList.body.list || []).length
      expect(responseCompleteList.status).toBe(200)
      expect(initialLength + 1).toBe(completeLength)

    })
    it("Должен добавлять и удалять города из избранных городов", async () => {
      const VIENNA_ID = 2761369
      const req = request(server.app)
      const responseInitialList = await req.get("/favorites")
      expect(responseInitialList.status).toBe(200)

      const initialLength = (responseInitialList.body.list || []).length
      const responsePost = await req.post("/favorites").send({id:VIENNA_ID})
      expect(responsePost.status).toBe(200)
      expect(responsePost.body).toHaveProperty("msg", "success")

      const responseCompleteList = await req.get("/favorites")
      const completeLength = (responseCompleteList.body.list || []).length
      expect(responseCompleteList.status).toBe(200)
      expect(initialLength + 1).toBe(completeLength)

      const responseDelete = await req.delete("/favorites").send({id:VIENNA_ID})
      expect(responsePost.status).toBe(200)
      expect(responsePost.body).toHaveProperty("msg", "success")

      const responseAfterDelete = await req.get("/favorites")
      const afterDeleteLength = (responseAfterDelete.body.list || []).length
      expect(responseAfterDelete.status).toBe(200)
      expect(initialLength).toBe(afterDeleteLength)
    })
  })

})

