import ConfigAPI from "../../src/api/config";

jest.spyOn(ConfigAPI, 'getConfig').mockResolvedValue();