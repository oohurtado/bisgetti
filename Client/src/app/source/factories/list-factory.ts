import { IOrder, IOrderSelected } from "../models/interfaces/page.interface";

export class ListFactory {

    public static getOrder(section: string): IOrder {
        switch (section) {
            case 'admin-users':
                return this.adminUsersOrder;
        }

        throw new Error(`ListFactory: '${section}' not implemented.`);
    }

    public static getOrderInit(order: IOrder): IOrderSelected {
        return {
            isAscending: order.isAscending,
            data: order.list[order.startPosition].data,
        };
    }

    //////////
    /* data */
    //////////

    private static adminUsersOrder: IOrder = {
        isAscending: true,
        startPosition: 0,
        list: [
            { data: "first-name", text: "Nombre", divider: false },
            { data: "last-name", text: "Apellido", divider: false },
            { data: "email", text: "Correo electrónico", divider: false },
        ],
    }
}