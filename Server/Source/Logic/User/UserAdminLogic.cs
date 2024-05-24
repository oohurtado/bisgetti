﻿using Microsoft.EntityFrameworkCore;
using Server.Source.Data;
using Server.Source.Models.DTOs;
using Server.Source.Models.DTOs.User.Admin;

namespace Server.Source.Logic.User
{
    public class UserAdminLogic
    {
        private readonly IAspNetRepository _aspNetRepository;

        public UserAdminLogic(IAspNetRepository aspNetRepository)
        {
            _aspNetRepository = aspNetRepository;
        }

        public async Task<PageResponse<UserResponse>> GetUserListAsync(string sortColumn, string sortOrder, int pageSize, int pageNumber, string term)
        {
            var users = await _aspNetRepository.GetUsers(sortColumn, sortOrder, pageSize, pageNumber, term, out int grandTotal).ToListAsync();         

            var userList = new List<UserResponse>();
            foreach (var user in users)
            {
                var roles = await _aspNetRepository.GetRolesFromUserAsync(user);
                userList.Add(new UserResponse()
                {
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Email = user.Email,
                    PhoneNumber = user.PhoneNumber,
                    UserRole = roles.Where(p => p.StartsWith("user-")).FirstOrDefault(),
                });
            }

            return new PageResponse<UserResponse> 
            { 
                GrandTotal = grandTotal,
                Data = userList,
            };
        }

        //public async Task ChangeUserRoleAsync(string executingUserRole, UserChangeUserRoleRequest request)
        //{
        //    // buscar user del correo a cambiar su rol
        //    var user = await _aspNetRepository.FindByEmailAsync(request.Email);
        //    if (user == null)
        //    {
        //        throw new EatSomeException(EnumResponseError.UserNotFound);
        //    }

        //    // obtenemos rol del usuario
        //    var roleToRemove = await _aspNetRepository.GetUserRoleAsync(user);

        //    // quitamos rol actual y asignamos nuevo rol
        //    await _aspNetRepository.SetUserRoleAsync(user, roleToRemove: roleToRemove, roleToAdd: request.Role);
        //}     
    }
}