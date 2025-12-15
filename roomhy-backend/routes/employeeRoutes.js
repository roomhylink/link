const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');

/**
 * GET /api/employees
 * Get all employees (with optional filters)
 * Query params: area, role, isActive (true/false)
 */
router.get('/', async (req, res) => {
    try {
        const { area, role, isActive } = req.query;
        const filter = {};
        if (area) filter.area = area;
        if (role) filter.role = role;
        if (typeof isActive !== 'undefined') filter.isActive = isActive === 'true';

        const employees = await Employee.find(filter).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, data: employees, count: employees.length });
    } catch (err) {
        console.error('Get employees error:', err);
        return res.status(500).json({ error: 'Failed to fetch employees', details: err.message });
    }
});

/**
 * GET /api/employees/:loginId
 * Get a specific employee by loginId
 */
router.get('/:loginId', async (req, res) => {
    try {
        const { loginId } = req.params;
        const employee = await Employee.findOne({ loginId });
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        return res.status(200).json({ success: true, data: employee });
    } catch (err) {
        console.error('Get employee error:', err);
        return res.status(500).json({ error: 'Failed to fetch employee', details: err.message });
    }
});

/**
 * POST /api/employees
 * Create a new employee
 * Body: { name, loginId, email, phone, password, role, area, areaCode, city, locationCode, permissions, parentLoginId }
 */
router.post('/', async (req, res) => {
    try {
        const { name, loginId, email, phone, password, role, area, areaCode, city, locationCode, permissions = [], parentLoginId } = req.body;

        if (!name || !loginId) {
            return res.status(400).json({ error: 'Missing required fields: name, loginId' });
        }

        // Check if loginId already exists
        const exists = await Employee.findOne({ loginId });
        if (exists) {
            return res.status(409).json({ error: 'Employee with this loginId already exists' });
        }

        const employee = await Employee.create({
            name,
            loginId,
            email,
            phone,
            password,
            role,
            area,
            areaCode,
            city,
            locationCode,
            permissions,
            parentLoginId
        });

        return res.status(201).json({ success: true, data: employee });
    } catch (err) {
        console.error('Create employee error:', err);
        return res.status(500).json({ error: 'Failed to create employee', details: err.message });
    }
});

/**
 * PATCH /api/employees/:loginId
 * Update an employee
 * Body: { name, email, phone, password, role, area, areaCode, city, permissions, isActive }
 */
router.patch('/:loginId', async (req, res) => {
    try {
        const { loginId } = req.params;
        const updates = req.body;

        const employee = await Employee.findOneAndUpdate(
            { loginId },
            { ...updates, updatedAt: new Date() },
            { new: true, runValidators: true }
        );

        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        return res.status(200).json({ success: true, data: employee });
    } catch (err) {
        console.error('Update employee error:', err);
        return res.status(500).json({ error: 'Failed to update employee', details: err.message });
    }
});

/**
 * DELETE /api/employees/:loginId
 * Delete an employee (soft delete by setting isActive = false)
 */
router.delete('/:loginId', async (req, res) => {
    try {
        const { loginId } = req.params;
        const employee = await Employee.findOneAndUpdate(
            { loginId },
            { isActive: false, updatedAt: new Date() },
            { new: true }
        );

        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        return res.status(200).json({ success: true, message: 'Employee deactivated', data: employee });
    } catch (err) {
        console.error('Delete employee error:', err);
        return res.status(500).json({ error: 'Failed to delete employee', details: err.message });
    }
});

/**
 * POST /api/employees/:loginId/reactivate
 * Reactivate a deactivated employee
 */
router.post('/:loginId/reactivate', async (req, res) => {
    try {
        const { loginId } = req.params;
        const employee = await Employee.findOneAndUpdate(
            { loginId },
            { isActive: true, updatedAt: new Date() },
            { new: true }
        );

        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        return res.status(200).json({ success: true, data: employee });
    } catch (err) {
        console.error('Reactivate employee error:', err);
        return res.status(500).json({ error: 'Failed to reactivate employee', details: err.message });
    }
});

module.exports = router;
