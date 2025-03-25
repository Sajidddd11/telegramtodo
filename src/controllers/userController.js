const supabase = require('../utils/supabase');
const bcrypt = require('bcrypt');

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user.user.id;

    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, phone, username, profile_picture, created_at')
      .eq('id', userId)
      .single();

    if (error) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get todo statistics
    const { data: todos, error: todoError } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', userId);

    if (todoError) {
      return res.status(500).json({ error: 'Error fetching todo statistics' });
    }

    const totalTodos = todos.length;
    const completedTodos = todos.filter(todo => todo.is_completed).length;
    const efficiency = totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0;

    res.json({
      user: data,
      statistics: {
        totalTodos,
        completedTodos,
        efficiency
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Server error while fetching profile' });
  }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.user.id;
    const { name, email, phone, profile_picture } = req.body;

    // Check if the user is updating their email to one that already exists
    if (email) {
      const { data: existingEmail, error: emailCheckError } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', email)
        .neq('id', userId)
        .single();

      if (!emailCheckError && existingEmail) {
        return res.status(400).json({ error: 'Email already in use by another account' });
      }
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (profile_picture) updateData.profile_picture = profile_picture;
    updateData.updated_at = new Date();

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Server error while updating profile' });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Please provide current and new password' });
    }

    // Get user with password
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('password')
      .eq('id', userId)
      .single();

    if (userError) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    const { error } = await supabase
      .from('users')
      .update({ 
        password: hashedPassword,
        updated_at: new Date()
      })
      .eq('id', userId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Server error while changing password' });
  }
}; 