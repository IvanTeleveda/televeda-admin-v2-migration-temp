import axios, { AxiosInstance } from "axios"
import {
    QueryFilter,
    QueryFilterArr,
    QuerySort,
    QuerySortArr,
    QuerySortOperator,
    RequestQueryBuilder,
    CondOperator,
    ComparisonOperator,
} from "@nestjsx/crud-request";
import { stringify } from "query-string";
import { CrudFilters as RefineCrudFilter, CrudOperators, CrudSorting, HttpError, DataProvider } from "@refinedev/core";

type SortBy = QuerySort | QuerySortArr | Array<QuerySort | QuerySortArr>;
type CrudFilters = QueryFilter | QueryFilterArr | Array<QueryFilter | QueryFilterArr>;

const axiosInstance = axios.create();

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

const interceptor = (client: AxiosInstance) => {
    client.interceptors.response.use(
        (response: any) => {
            if (!response) return;
            if (response.request && response.request.responseURL) {
                const url = new URL(response.request.responseURL);
                if (url.pathname === '/admin/totp-auth') {
                    const search = new URLSearchParams(url.search);
                    const goto = search.get('goto') || 'admin/surveys';
                    return window.location.href = `${SERVER_URL}/admin/totp-auth?goto=${goto}`;
                }
                return response
            }
            return response;
        },
        (error) => {
            console.log("responseRR: ", error)
            const customError: HttpError = {
                ...error,
                message: error.response?.data?.message,
                statusCode: error.response?.status,
            };

            return Promise.reject(customError);
        },
    );
}

const mapOperator = (operator: CrudOperators): ComparisonOperator => {
    switch (operator) {
        case "ne":
            return CondOperator.NOT_EQUALS;
        case "lt":
            return CondOperator.LOWER_THAN;
        case "gt":
            return CondOperator.GREATER_THAN;
        case "lte":
            return CondOperator.LOWER_THAN_EQUALS;
        case "gte":
            return CondOperator.GREATER_THAN_EQUALS;
        case "in":
            return CondOperator.IN;
        case "nin":
            return CondOperator.NOT_IN;
        //Changed to: Contains any, in postgres: ILIKE ANY (ARRAY[...])
        case "contains":
            return CondOperator.CONTAINS_LOW;
        case "ncontains":
            return CondOperator.EXCLUDES_LOW;
        case "containss":
            return CondOperator.CONTAINS;
        case "ncontainss":
            return CondOperator.EXCLUDES;
        case "between":
            return CondOperator.BETWEEN;
        case "null":
            return CondOperator.IS_NULL;
    }

    return CondOperator.EQUALS;
};

export const generateSort = (sort?: CrudSorting): SortBy | undefined => {
    if (sort && sort.length > 0) {
        const multipleSort: SortBy = [];
        sort.map(({ field, order }) => {
            if (field && order) {
                multipleSort.push({
                    field: field,
                    order: order.toUpperCase() as QuerySortOperator,
                });
            }
        });
        return multipleSort;
    }

    return;
};

const mapFilterValue = (value: any) => {
    if (!value) return undefined;
    if (value instanceof String && value == '') return undefined;
    if (value instanceof Array && value.length < 1) return undefined;

    return value;
}

export const generateFilter = (
    filters?: RefineCrudFilter,
): { crudFilters: CrudFilters; orFilters: CrudFilters } => {
    const crudFilters: CrudFilters = [];
    const orFilters: CrudFilters = [];
    if (filters) {
        filters.map((filter) => {
            if (filter.operator !== "or") {
                const filterValue = mapFilterValue(filter.value);
                if (!filterValue) return;
                crudFilters.push({
                    //@ts-ignore
                    field: filter.field,
                    operator: mapOperator(filter.operator),
                    value: filterValue,
                });
            } else {
                filter.value.map((orFilter) => {
                    const filterValue = mapFilterValue(filter.value);
                    if (!filterValue) return;
                    orFilters.push({
                        //@ts-ignore
                        field: orFilter.field,
                        operator: mapOperator(orFilter.operator),
                        value: filterValue,
                    });
                });
            }
        });
    }

    return { crudFilters, orFilters };
};

const NestsxCrudDataProvider = (
    apiUrl: string,
    httpClient: AxiosInstance = axiosInstance,
): DataProvider => ({

    getList: async ({ resource, pagination, filters, sort, meta }) => {
        interceptor(httpClient)
        const url = `${apiUrl}/${resource}`;

        console.log("API URL:", url);

        const current = pagination?.current || 1;
        const pageSize = pagination?.pageSize || 10;

        const { crudFilters, orFilters } = generateFilter(filters);

        const query = RequestQueryBuilder.create()
            .setFilter(crudFilters)
            .setOr(orFilters)
            .setLimit(pageSize)
            .setPage(current)
            .setOffset((current - 1) * pageSize);

        const sortBy = generateSort(sort);
        if (sortBy) {
            query.sortBy(sortBy);
        }

        console.log("======================");
        console.log("* filters:", filters);
        console.log("* crudFilters:", crudFilters);
        console.log("======================");

        const { data } = await httpClient.get(`${url}?${query.query()}`);

        return {
            data: data.data,
            total: data.total,
        };
    },

    getMany: async ({ resource, ids }) => {
        interceptor(httpClient)
        const url = `${apiUrl}/${resource}`;

        const query = RequestQueryBuilder.create()
            .setFilter({
                field: "id",
                operator: CondOperator.IN,
                value: ids,
            })
            .query();

        const { data } = await httpClient.get(`${url}?${query}`);

        return {
            data,
        };
    },

    create: async ({ resource, variables }) => {
        interceptor(httpClient)
        const url = `${apiUrl}/${resource}`;
        const { data } = await httpClient.post(url, variables);

        return {
            data,
        };
    },

    update: async ({ resource, id, variables }) => {
        interceptor(httpClient)
        const url = `${apiUrl}/${resource}/${id}`;

        const { data } = await httpClient.patch(url, variables);

        return {
            data,
        };
    },

    updateMany: async ({ resource, ids, variables }) => {
        interceptor(httpClient)
        const response = await Promise.all(
            ids.map(async (id) => {
                const { data } = await httpClient.patch(
                    `${apiUrl}/${resource}/${id}`,
                    variables,
                );
                return data;
            }),
        );

        return { data: response };
    },

    createMany: async ({ resource, variables }) => {
        interceptor(httpClient)
        const url = `${apiUrl}/${resource}/bulk`;

        const { data } = await httpClient.post(url, { bulk: variables });

        return {
            data,
        };
    },

    getOne: async ({ resource, id }) => {
        interceptor(httpClient);
        const url = `${apiUrl}/${resource}/${id}`;

        const { data } = await httpClient.get(url);

        return {
            data,
        };
    },

    deleteOne: async ({ resource, id }) => {
        interceptor(httpClient)
        const url = `${apiUrl}/${resource}/${id}`;

        const { data } = await httpClient.delete(url);

        return {
            data,
        };
    },

    deleteMany: async ({ resource, ids }) => {
        interceptor(httpClient)
        const url = `${apiUrl}/${resource}/bulk_delete`;

        const { data } = await httpClient.post(url, { ids: ids });

        return {
            data,
        };
    },

    getApiUrl: () => {
        return apiUrl;
    },

    custom: async ({ url, method, filters, sorters, payload, query, headers }) => {
        interceptor(httpClient);

        const { crudFilters } = generateFilter(filters);
        const requestQueryBuilder = RequestQueryBuilder.create().setFilter(crudFilters);
        const sortBy = generateSort(sorters);
    
        if (sortBy) {
            requestQueryBuilder.sortBy(sortBy);
        }

        let requestUrl = `${url}?${requestQueryBuilder.query()}`;

        if (query) {
            requestUrl = `${requestUrl}&${stringify(query)}`;
        }
        if (headers) {
            httpClient.defaults.headers = {
                ...httpClient.defaults.headers,
                ...headers as any,
            };
        }

        let axiosResponse;
        switch (method) {
            case "put":
            case "post":
            case "patch":
                axiosResponse = await httpClient[method](url, payload);
                break;
            case "delete":
                axiosResponse = await httpClient.delete(url);
                break;
            default:
                axiosResponse = await httpClient.get(requestUrl);
                break;
        }

        const { data } = axiosResponse;

        return Promise.resolve({ data });
    },
});

export default NestsxCrudDataProvider;
