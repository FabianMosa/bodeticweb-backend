/**
 * Pruebas unitarias - Historial de movimientos (filtro por documento).
 *
 * Objetivo:
 * - Evitar regresiones en el filtro `codigo_documento`.
 * - Verificar que el backend use parámetros bind (mitigación SQL injection).
 */
import { jest } from "@jest/globals";

const mockQuery = jest.fn();
const mockWorksheet = {
  columns: [],
  addRows: jest.fn(),
};
const mockWorkbookInstance = {
  creator: "",
  created: null,
  addWorksheet: jest.fn(() => mockWorksheet),
  xlsx: { write: jest.fn(async () => {}) },
};
const mockWorkbookCtor = jest.fn(() => mockWorkbookInstance);

jest.unstable_mockModule("../config/db.js", () => ({
  pool: {
    query: mockQuery,
  },
}));

jest.unstable_mockModule("exceljs", () => ({
  default: {
    Workbook: mockWorkbookCtor,
  },
}));

const { getHistorialMovimientos } = await import(
  "../controllers/movimiento.controller.js"
);

const createRes = () => {
  const res = {
    json: jest.fn(),
    status: jest.fn(),
    setHeader: jest.fn(),
    end: jest.fn(),
  };
  res.status.mockReturnValue(res);
  return res;
};

describe("getHistorialMovimientos - filtro codigo_documento", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("aplica filtro por codigo_documento en respuesta JSON paginada", async () => {
    mockQuery
      .mockResolvedValueOnce([[{ totalItems: 1 }]])
      .mockResolvedValueOnce([
        [
          {
            PK_id_movimiento: 99,
            codigo_documento: "FAC-2026-001",
          },
        ],
      ]);

    const req = {
      query: {
        codigo_documento: "FAC-2026-001",
        page: 1,
        limit: 20,
      },
    };
    const res = createRes();

    await getHistorialMovimientos(req, res);

    expect(mockQuery).toHaveBeenCalledTimes(2);

    const [countSql, countParams] = mockQuery.mock.calls[0];
    expect(countSql).toContain("LIKE ?");
    expect(countParams).toContain("%FAC-2026-001%");

    const [dataSql, dataParams] = mockQuery.mock.calls[1];
    expect(dataSql).toContain("AS codigo_documento");
    expect(dataSql).toContain("LIMIT ? OFFSET ?");
    expect(dataParams).toEqual(expect.arrayContaining(["%FAC-2026-001%", 20, 0]));

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.any(Array),
        pagination: expect.objectContaining({
          currentPage: 1,
          totalPages: 1,
          totalItems: 1,
        }),
      })
    );
  });

  it("usa parámetros bind con input malicioso y no concatena SQL inseguro", async () => {
    mockQuery
      .mockResolvedValueOnce([[{ totalItems: 0 }]])
      .mockResolvedValueOnce([[]]);

    const payload = "' OR 1=1 --";
    const req = {
      query: {
        codigo_documento: payload,
        page: 1,
        limit: 10,
      },
    };
    const res = createRes();

    await getHistorialMovimientos(req, res);

    const [countSql, countParams] = mockQuery.mock.calls[0];
    expect(countSql).toContain("LIKE ?");
    expect(countSql).not.toContain(payload);
    expect(countParams).toContain(`%${payload}%`);
    expect(res.status).not.toHaveBeenCalledWith(500);
  });

  it("aplica el mismo filtro por documento al exportar Excel", async () => {
    mockQuery.mockResolvedValueOnce([
      [
        {
          PK_id_movimiento: 1,
          codigo_documento: "GUIA-7788",
          descripcion: "Ingreso inicial",
        },
      ],
    ]);

    const req = {
      query: {
        formato: "excel",
        codigo_documento: "GUIA-7788",
      },
    };
    const res = createRes();

    await getHistorialMovimientos(req, res);

    expect(mockQuery).toHaveBeenCalledTimes(1);
    const [excelSql, excelParams] = mockQuery.mock.calls[0];
    expect(excelSql).toContain("ORDER BY m.fecha_hora DESC");
    expect(excelSql).toContain("LIKE ?");
    expect(excelParams).toContain("%GUIA-7788%");

    expect(mockWorkbookCtor).toHaveBeenCalledTimes(1);
    expect(mockWorksheet.addRows).toHaveBeenCalledWith(expect.any(Array));
    expect(res.setHeader).toHaveBeenCalled();
    expect(res.end).toHaveBeenCalled();
  });

  it("ignora filtro de codigo_documento cuando llega vacío", async () => {
    mockQuery
      .mockResolvedValueOnce([[{ totalItems: 2 }]])
      .mockResolvedValueOnce([[]]);

    const req = {
      query: {
        codigo_documento: "",
        page: 1,
        limit: 10,
      },
    };
    const res = createRes();

    await getHistorialMovimientos(req, res);

    const [countSql, countParams] = mockQuery.mock.calls[0];
    expect(countSql).not.toContain("LIKE ?");
    expect(countParams).toEqual([]);
  });

  it("ignora filtro de codigo_documento cuando solo contiene espacios", async () => {
    mockQuery
      .mockResolvedValueOnce([[{ totalItems: 0 }]])
      .mockResolvedValueOnce([[]]);

    const req = {
      query: {
        codigo_documento: "    ",
        page: 1,
        limit: 10,
      },
    };
    const res = createRes();

    await getHistorialMovimientos(req, res);

    const [countSql, countParams] = mockQuery.mock.calls[0];
    expect(countSql).not.toContain("LIKE ?");
    expect(countParams).toEqual([]);
  });
});
