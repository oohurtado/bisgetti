import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OrderStatusCustomerForDeliveryPipe } from '../../../pipes/order-status-customer-for-delivery.pipe';
import { OrderStatusCustomerTakeAwayPipe } from '../../../pipes/order-status-customer-take-away.pipe';
import { BusinessService } from '../../../services/business/business.service';
import { DateService } from '../../../services/common/date.service';
import { LocalStorageService } from '../../../services/common/local-storage.service';
import { general } from '../../../source/general';
import { Grouping } from '../../../source/models/common/grouping';
import { Tuple3 } from '../../../source/models/common/tuple';
import { OrderElementResponse } from '../../../source/models/dtos/entities/order-element-response';
import { OrderResponse } from '../../../source/models/dtos/entities/order-response';
import { OrderStatusResponse } from '../../../source/models/dtos/entities/order-status-response';
import { PageBase } from '../../../source/page-base';
import { Utils } from '../../../source/utils';
import * as lodash from 'lodash';

@Component({
  selector: 'app-orders-list-boss',
  templateUrl: './orders-list-boss.component.html',
  styleUrl: './orders-list-boss.component.css'
})
export class OrdersListBossComponent extends PageBase<OrderResponse> implements OnInit {
    _filter!: string;
	_filterMenu: Tuple3<string, string, boolean>[] = []; // data, text, selected

	constructor(
		private businessService: BusinessService,
		private router: Router,		
		public dateService: DateService,
		localStorageService: LocalStorageService
	) {
		super('orders', localStorageService);

		// this._filterMenu.push(new Tuple3<string, string, boolean>('Empezado,Aceptado,Cancelado,Declinado,Cocinando,Listo,En Ruta,Entregado','Todos', true));
        // this._filterMenu.push(new Tuple3<string, string, boolean>('Empezado','Empezado', false));
        // this._filterMenu.push(new Tuple3<string, string, boolean>('Aceptado', 'Aceptado', false));
        // this._filterMenu.push(new Tuple3<string, string, boolean>('Cancelado','Cancelado', false));
        // this._filterMenu.push(new Tuple3<string, string, boolean>('Declinado','Declinado', false));
        // this._filterMenu.push(new Tuple3<string, string, boolean>('Cocinando','Cocinando', false));
        // this._filterMenu.push(new Tuple3<string, string, boolean>('Listo','Listo', false));
        // this._filterMenu.push(new Tuple3<string, string, boolean>('En Ruta','En Ruta', false));
        // this._filterMenu.push(new Tuple3<string, string, boolean>('Entregado','Entregado', false));
        // this._filter = this._filterMenu[0].param1;

        this._filterMenu.push(new Tuple3<string, string, boolean>('Empezado,Aceptado,Cancelado,Declinado,Cocinando,Listo,En Ruta,Entregado','Todos', true));
		this._filterMenu.push(new Tuple3<string, string, boolean>('Empezado,Cocinando,Listo,En Ruta','En Proceso', false));
		this._filterMenu.push(new Tuple3<string, string, boolean>('Cancelado,Declinado','Otros', false));
		this._filterMenu.push(new Tuple3<string, string, boolean>('Entregado','Entregados', false));
		this._filter = this._filterMenu[0].param1;
	}

    async ngOnInit() {
		await this.getDataAsync();
	}

    override async getDataAsync() {
		this._error = null;
		this._isProcessing = true;	
		await this.businessService
			.order_getOrdersByPageAsync(this._pageOrderSelected.data, this._pageOrderSelected.isAscending ? 'asc' : 'desc', this.pageSize, this.pageNumber, this._filter)
			.then(p => {
				this._pageData = p;
				this.updatePage(p);
			})
			.catch(e => {
				this._error = Utils.getErrorsResponse(e);				
			});
		this._isProcessing = false;
    }

	override onCreateClicked(event: Event): void {
		throw new Error('Method not implemented.');
	}

	getTotal(order: OrderResponse) {
		let total = order.productTotal + ((order.productTotal * (order.tipPercent ?? 0)) / 100) + order.shippingCost;
		return total;
	}

	getTip(order: OrderResponse) {
		if (order.tipPercent == 0) {
			return 0;
		}

		let total = ((order.productTotal * (order.tipPercent ?? 0)) / 100);
		return total;
	}

	getComments(order: OrderResponse) {
		if (order.comments === '' || order.comments === null) {
			return '...';
		}

		return order.comments;
	}

	getAddress(order: OrderResponse) {
		return `${order.address.name}, ${order.address.street}, #${order.address.exteriorNumber} ${order.address.interiorNumber}, ${order.address.postalCode}`
	}

	async onLoadOrderDetailsClicked(event: Event, order: OrderResponse) {
		this._isProcessing = true;		
		await this.businessService.order_getOrderAsync(order.id)
			.then(p => {
				order._detailsLoaded = true;	
				
				order.orderElements = p.orderElements;
				order._orderElementsGrouped = lodash.map(lodash.groupBy(order.orderElements, p => p.personName), (data, key) => {
					let info: Grouping<string, OrderElementResponse> = new Grouping<string, OrderElementResponse>();
					info.key = key;
					info.items = data
					
					return info;
				});
				
				order.orderStatuses = p.orderStatuses;
				order.orderStatuses = lodash.sortBy(order.orderStatuses, p => p.eventAt);
				order.orderStatuses = lodash.reverse(order.orderStatuses);

				order._cols = "col-md-6";
			})
			.catch(e => {
				this._error = Utils.getErrorsResponse(e);				
			});
		this._isProcessing = false;
	}

	getTotalByPerson(products: OrderElementResponse[]) {
		let sum = 0;
		products.forEach(p => sum += p.productPrice * p.productQuantity);
		return sum;
	}

	getStatusFromOrder(order: OrderResponse) {
		if (order.deliveryMethod === general.DELIVERY_METHOD_FOR_DELIVER) {
			// let pipe = new OrderStatusCustomerForDeliveryPipe();
			// let str = pipe.transform(order.status);
			// return str;
			return order.status
		} else if (order.deliveryMethod === general.DELIVERY_METHOD_TAKE_AWAY) {
			// let pipe = new OrderStatusCustomerTakeAwayPipe();
			// let str = pipe.transform(order.status);
			// return str;
			return order.status
		}

		return 'lol';
	}

	getStatusFromOrderStatus(order: OrderResponse, status: OrderStatusResponse) {
		if (order.deliveryMethod === general.DELIVERY_METHOD_FOR_DELIVER) {
			// let pipe = new OrderStatusCustomerForDeliveryPipe();
			// let str = pipe.transform(status.status);
			// return str;
			return status.status
		} else if (order.deliveryMethod === general.DELIVERY_METHOD_TAKE_AWAY) {
			// let pipe = new OrderStatusCustomerTakeAwayPipe();
			// let str = pipe.transform(status.status);
			// return str;
			return status.status
		}
		
		return 'lol';
	}

	async onFilterClicked(filter: string) {
		this._filterMenu.forEach(p => {
			p.param3 = false;

			if (p.param1 === filter) {
				p.param3 = true;
				this._filter = filter;
			}
		});

		await this.getDataAsync();
	}

	getStatusDetail() {
		let element = this._filterMenu.filter(p => p.param3)[0];
		let arrStatuses = element.param1.split(',');
		let str = element.param2 + ": " + arrStatuses.join(', ');
		return str;
	}
}
