﻿
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json.Linq;
using Server.Source.Data.Interfaces;
using Server.Source.Exceptions;
using Server.Source.Extensions;
using Server.Source.Models.DTOs.Business.MenuStuff;
using Server.Source.Models.DTOs.Business.Product;
using Server.Source.Models.Entities;
using Server.Source.Models.Enums;
using Server.Source.Services.Interfaces;
using Server.Source.Utilities;
using System.ComponentModel;
using System.Linq.Expressions;
using System.Xml.Linq;

namespace Server.Source.Logic
{
    public class BusinessLogicMenuStuff
    {
        private readonly IBusinessRepository _businessRepository;
        private readonly IStorageFile _storageFile;
        private readonly IMapper _mapper;

        private const string CONTAINER_FILE = "menu-images";

        public BusinessLogicMenuStuff(
            IBusinessRepository businessRepository,
            IStorageFile storageFile,
            IMapper mapper
            )
        {
            _businessRepository = businessRepository;
            _storageFile = storageFile;
            _mapper = mapper;
        }

        public async Task<List<MenuStuffResponse>> GetMenuStuffAsync(int menuId)
        {
            var data = await _businessRepository.GetMenuStuff(menuId).ToListAsync();
            var result = _mapper.Map<List<MenuStuffResponse>>(data);
            return result;
        }

        public async Task AddOrRemoveElementAsync(AddOrRemoveElementRequest request)
        {
            if (request.Action == EnumElementAction.Add.GetDescription())
            {
                await AddElementAsync(request);
                return;
            }
            else if (request.Action == EnumElementAction.Remove.GetDescription())
            {
                await RemoveElementAsync(request);
                return;
            }

            throw new NotImplementedException();
        }

        private async Task AddElementAsync(AddOrRemoveElementRequest request)
        {
            // agregando categoria a menu
            if (request.MenuId != null && request.CategoryId != null && request.ProductId == null)
            {
                var position = await _businessRepository.GetPositionFromLastElementAsync(p => p.MenuId == request.MenuId && p.CategoryId != null && p.ProductId == null);

                var element = new MenuStuffEntity()
                {
                    MenuId = request.MenuId,
                    CategoryId = request.CategoryId,                    
                    IsVisible = true,
                    IsAvailable = true,
                    Position = position + 1,
                };

                var any = await _businessRepository.ElementExistsAsync(p => p.MenuId == element.MenuId && p.CategoryId == element.CategoryId && p.ProductId == null);
                if (any)
                {
                    throw new EatSomeInternalErrorException(EnumResponseError.BusinessElementAlreadyExists);
                }

                await _businessRepository.AddElementAsync(element);
                return;
            }

            // agregando producto a categoria
            if (request.MenuId != null && request.CategoryId != null && request.ProductId != null)
            {
                var position = await _businessRepository.GetPositionFromLastElementAsync(p => p.MenuId == request.MenuId && p.CategoryId == request.CategoryId && p.ProductId != null);

                var element = new MenuStuffEntity()
                {
                    MenuId = request.MenuId,
                    CategoryId = request.CategoryId,
                    ProductId = request.ProductId,
                    IsVisible = true,
                    IsAvailable = true,
                    Position = position + 1,
                };

                var any = await _businessRepository.ElementExistsAsync(p => p.MenuId == element.MenuId && p.CategoryId == element.CategoryId && p.ProductId == element.ProductId);
                if (any)
                {
                    throw new EatSomeInternalErrorException(EnumResponseError.BusinessElementAlreadyExists);
                }

                await _businessRepository.AddElementAsync(element);
                return;
            }

            throw new EatSomeInternalErrorException(EnumResponseError.BusinessUnknownActionForElement);
        }

        private async Task RemoveElementAsync(AddOrRemoveElementRequest request)
        {
            // quitando categoria
            if (request.MenuId != null && request.CategoryId != null && request.ProductId == null)
            {
                var any = await _businessRepository.ElementExistsAsync(p => p.MenuId == request.MenuId && p.CategoryId == request.CategoryId);
                if (!any)
                {
                    throw new EatSomeInternalErrorException(EnumResponseError.BusinessElementDoesNotExists);
                }

                await _businessRepository.RemoveElementAsync(p => p.MenuId == request.MenuId && p.CategoryId == request.CategoryId);
                return;
            }

            // quitando producto
            if (request.MenuId != null && request.CategoryId != null && request.ProductId != null)
            {
                var any = await _businessRepository.ElementExistsAsync(p => p.MenuId == request.MenuId && p.CategoryId == request.CategoryId && p.ProductId == request.ProductId);
                if (!any)
                {
                    throw new EatSomeInternalErrorException(EnumResponseError.BusinessElementDoesNotExists);
                }

                await _businessRepository.RemoveElementAsync(p => p.MenuId == request.MenuId && p.CategoryId == request.CategoryId && p.ProductId == request.ProductId);
                return;
            }

            throw new EatSomeInternalErrorException(EnumResponseError.BusinessUnknownActionForElement);
        }

        public async Task UpdateElementPositionAsync(PositionElementRequest request)
        {
            Expression<Func<MenuStuffEntity, bool>> exp = p => true;

            // identificamos que moveremos, si categoria
            if (request.MenuId != null && request.CategoryId != null && request.ProductId == null)
            {
                exp = p => p.MenuId == request.MenuId && p.CategoryId != null && p.ProductId == null;
            }
            // identificamos que moveremos, si producto
            else if (request.MenuId != null && request.CategoryId != null && request.ProductId != null)
            {
                exp = p => p.MenuId == request.MenuId && p.CategoryId == request.CategoryId && p.ProductId != null;
            }
            else
            {
                throw new EatSomeInternalErrorException(EnumResponseError.BusinessUnknownActionForElement);
            }
            
            // obtenemos o todas las categorias del menú o todos los productos de la categoria del menú, EN ORDEN
            var elements = await _businessRepository
                .GetMenuStuff(exp)
                .OrderBy(p => p.Position)
                .ToListAsync();

            for (int i = 0; i < elements.Count; i++)
            {
                // identificamos elemento a mover
                if (elements[i].MenuId == request.MenuId && elements[i].CategoryId == request.CategoryId && elements[i].ProductId == request.ProductId)
                {
                    if (request.Action == EnumElementAction.MoveUp.GetDescription())
                    {
                        if (i == 0)
                        {
                            throw new EatSomeInternalErrorException(EnumResponseError.BusinessForbiddenActionForElement);
                        }

                        var tmp = elements[i].Position;
                        elements[i].Position = elements[i - 1].Position;
                        elements[i - 1].Position = tmp;
                        await _businessRepository.UpdateAsync();

                        return;
                    }
                    else if (request.Action == EnumElementAction.MoveDown.GetDescription())
                    {
                        if (i == elements.Count - 1)
                        {
                            throw new EatSomeInternalErrorException(EnumResponseError.BusinessForbiddenActionForElement);
                        }

                        var tmp = elements[i].Position;
                        elements[i].Position = elements[i + 1].Position;
                        elements[i + 1].Position = tmp;
                        await _businessRepository.UpdateAsync();

                        return;
                    }
                    else
                    {
                        throw new EatSomeInternalErrorException(EnumResponseError.BusinessUnknownActionForElement);
                    }
                }
            }            
        }

        public async Task UpdateElementSettingsAsync(SettingsElementRequest request)
        {
            var element = await _businessRepository
                .GetMenuStuff(p => p.MenuId == request.MenuId && p.CategoryId == request.CategoryId && p.ProductId == request.ProductId)
                .OrderBy(p => p.Position)
                .FirstOrDefaultAsync();

            if (element == null)
            {
                throw new EatSomeNotFoundErrorException(EnumResponseError.BusinessElementDoesNotExists);
            }

            // menu
            if (element.MenuId != null && element.CategoryId == null && element.ProductId == null)
            {
                element.IsVisible = request.IsVisible ?? false;
                element.IsAvailable = request.IsAvailable ?? false;
                await _businessRepository.UpdateAsync();
                return;
            }

            // categoria
            if (element.MenuId != null && element.CategoryId != null && element.ProductId == null)
            {
                element.IsVisible = request.IsVisible ?? false;
                await _businessRepository.UpdateAsync();
                return;
            }

            // producto
            if (element.MenuId != null && element.CategoryId != null && element.ProductId != null)
            {
                element.IsVisible = request.IsVisible ?? false;
                element.IsAvailable = request.IsAvailable ?? false;
                await _businessRepository.UpdateAsync();
                return;
            }

            throw new EatSomeInternalErrorException(EnumResponseError.BusinessUnknownActionForElement);
        }

        public async Task UpdateElementImageAsync(ImageElementRequest request)
        {
            if (request.File == null)
            {
                throw new EatSomeInternalErrorException(EnumResponseError.BusinessElementImageMissing);
            }

            var element = await _businessRepository
                .GetMenuStuff(p => p.MenuId == request.MenuId && p.CategoryId == request.CategoryId && p.ProductId == request.ProductId)                
                .FirstOrDefaultAsync();

            string currentImage = element?.Image!;
            var newFilename = await FileUtility.CreateOrUpdateAsync(_storageFile, request.File, currentImage, CONTAINER_FILE);

            element!.Image = newFilename;
            await _businessRepository.UpdateAsync();
        }

        internal async Task DeleteElementImageAsync(int? menuId, int? categoryId, int? productId)
        {
            if (menuId == 0)
            {
                menuId = null;
            }
            if (categoryId == 0)
            {
                categoryId = null;
            }
            if (productId == 0)
            {
                productId = null;
            }

            var element = await _businessRepository
                .GetMenuStuff(p => p.MenuId == menuId && p.CategoryId == categoryId && p.ProductId == productId)
                .FirstOrDefaultAsync();

            string currentImage = element?.Image!;
            await FileUtility.DeleteAsync(_storageFile, currentImage, CONTAINER_FILE);

            element!.Image = null;
            await _businessRepository.UpdateAsync();
        }
    }
}
