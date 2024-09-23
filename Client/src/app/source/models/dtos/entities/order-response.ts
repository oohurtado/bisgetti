import { Grouping } from "../../common/grouping";
import { AddressResponse } from "./address-response";
import { OrderElementResponse } from "./order-element-response";
import { OrderStatusResponse } from "./order-status-response";

export class OrderResponse {
    id!: number;
    deliveryMethod!: string;
    createdAt!: Date;
    comments!: string;
    tipPercent!: number;
    payingWith!: number;
    productTotal!: number;
    productCount!: number;
    shippingCost!: number;
    addressName!: string;
    address!: AddressResponse;
    orderStatuses!: OrderStatusResponse[];
    orderElements!: OrderElementResponse[];

    _detailsLoaded!: boolean;
    _orderElements: Grouping<string, OrderElementResponse>[] = [];
}