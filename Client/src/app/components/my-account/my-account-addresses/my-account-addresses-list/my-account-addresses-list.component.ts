import { Component, OnInit } from '@angular/core';
import { ListBase } from '../../../../source/list-base';
import { AddressResponse } from '../../../../source/models/business/address-response';
import { INavigationOptionSelected } from '../../../../source/models/interfaces/page.interface';
import { Router } from '@angular/router';
import { LocalStorageService } from '../../../../services/common/local-storage.service';
import { UserMyAccountService } from '../../../../services/business/user/user-my-account.service';
import { Utils } from '../../../../source/utils';
import { UpdateAddressDefaultRequest } from '../../../../source/models/dtos/user/my-account/address/update-address-default-request';
declare let alertify: any;

@Component({
    selector: 'app-my-account-addresses-list',
    templateUrl: './my-account-addresses-list.component.html',
    styleUrl: './my-account-addresses-list.component.css'
})
export class MyAccountAddressesListComponent extends ListBase<AddressResponse> implements OnInit {

    constructor(
        private router: Router,
		localStorageService: LocalStorageService,
        private userMyAccountService: UserMyAccountService
    ) {
        super(null, localStorageService)
    }
    
    async ngOnInit() {
		await this.getDataAsync();
	}

    override async getDataAsync() {
		this._error = null;
		this._isProcessing = true;
		await this.userMyAccountService
			.getAddressesByPageAsync()
			.then(p => {				
				this._pageData = p;
				this.updatePage(p);
			})
			.catch(e => {
				this._error = Utils.getErrorsResponse(e);	
			});
		this._isProcessing = false;
    }

	onCreateClicked(event: Event) {
		let button = event.target as HTMLButtonElement;
        button.blur();
		this.router.navigateByUrl('/my-account/addresses/create');
	}

	onUpdateClicked(event: Event, address: AddressResponse) {
		let button = event.target as HTMLButtonElement;
        button.blur();
		this.router.navigateByUrl(`/my-account/addresses/update/${address.id}`);
	}
	
	onDeleteClicked(event: Event, address: AddressResponse) {
		let button = event.target as HTMLButtonElement;
        button.blur();

		let message: string = `
			¿Estás seguro de querer borrar la dirección: <b>${address.name}</b>?
			<br>
			<small><strong>Ten en cuenta lo siguiente:</strong> Los envíos en curso no serán cancelados, y el historial de tus compras permanecerá igual.</small>
			`;

		let component = this;
		alertify.confirm("Confirmar eliminación", message,
			function () {
				component._isProcessing = true;
				component.userMyAccountService.deleteAddress(address.id)
					.subscribe({
						complete: () => {
							component._isProcessing = false;
						},
						error: (errorResponse : string) => {
							component._isProcessing = false;
							component._error = Utils.getErrorsResponse(errorResponse);					
						},
						next: (val) => {							
							component._pageData.data = component._pageData.data.filter(p => p.id != address.id);
						}
					});				
			},
			function () {
				// ...
			});		
	}

	onDefaultClicked(event: Event, address: AddressResponse) {
		let button = event.target as HTMLButtonElement;
        button.blur();

		this._isProcessing = true;

		let model = new UpdateAddressDefaultRequest(!address.isDefault)
		this.userMyAccountService.updateAddressDefault(address.id, model)
		.subscribe({
			complete: () => {
				this._isProcessing = false;
			},
			error: (errorResponse : string) => {
				this._isProcessing = false;
				this._error = Utils.getErrorsResponse(errorResponse);					
			},
			next: (val) => {
				if (model.isDefault) {					
					this._pageData.data
						.filter(p => p.id != address.id && p.isDefault)
						.forEach(p => {
							p.isDefault = false
						});
				}
				this._pageData.data.filter(p => p.id == address.id)[0].isDefault = !address.isDefault;
			}
		});
	}
}
